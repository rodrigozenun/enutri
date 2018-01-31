(function (angular) {
  "use strict";

  var app = angular.module('myApp.account', ['firebase', 'firebase.utils', 'firebase.auth', 'ngRoute']);

  app.controller('AccountCtrl', ['$scope', 'Auth', 'fbutil', 'user', '$location', '$firebaseObject',
    function($scope, Auth, fbutil, user, $location, $firebaseObject) {
      var unbind;
      // create a 3-way binding with the user profile object in Firebase
      var profile = $firebaseObject(fbutil.ref('users', user.uid));
      profile.$bindTo($scope, 'profile').then(function(ub) { unbind = ub; });

      // expose logout function to scope
      $scope.logout = function() {
        if( unbind ) { unbind(); }
        profile.$destroy();
        Auth.$unauth();
        $location.path('/login');
      };

      $scope.changePassword = function(pass, confirm, newPass) {
        resetMessages();
        if( !pass || !confirm || !newPass ) {
          $scope.err = 'Please fill in all password fields';
        }
        else if( newPass !== confirm ) {
          $scope.err = 'New pass and confirm do not match';
        }
        else {
          Auth.$changePassword({email: profile.email, oldPassword: pass, newPassword: newPass})
            .then(function() {
              $scope.msg = 'Password changed';
            }, function(err) {
              $scope.err = err;
            })
        }
      };

      $scope.clear = resetMessages;

      $scope.changeEmail = function(pass, newEmail) {
        resetMessages();
        var oldEmail = profile.email;
        Auth.$changeEmail({oldEmail: oldEmail, newEmail: newEmail, password: pass})
          .then(function() {
            // store the new email address in the user's profile
            return fbutil.handler(function(done) {
              fbutil.ref('users', user.uid, 'email').set(newEmail, done);
            });
          })
          .then(function() {
            $scope.emailmsg = 'Email changed';
          }, function(err) {
            $scope.emailerr = err;
          });
      };

      function resetMessages() {
        $scope.err = null;
        $scope.msg = null;
        $scope.emailerr = null;
        $scope.emailmsg = null;
      }


      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.message = null;
      $scope.error = null;

      $scope.login = function(email, pass) {
        $scope.err = null;
        Auth.$authWithPassword({ email: email, password: pass }, {rememberMe: true})
            .then(function(/* user */) {
              $location.path('/home');
            }, function(err) {
              $scope.err = errMessage(err);
            });
      };

      $scope.resetPassword = function() {
        $scope.message = null;
        $scope.error = null;

        Auth.$resetPassword({
          email: $scope.email
        }).then(function() {
          $scope.message = "Plase check your e-mail";
        }).catch(function(error) {
          $scope.error = error;
        });
      };

      $scope.createAccount = function() {
        $scope.err = null;
        if( assertValidAccountProps() ) {
          var email = $scope.email;
          var pass = $scope.pass;
          // create user credentials in Firebase auth system
          Auth.$createUser({email: email, password: pass})
              .then(function() {
                // authenticate so we have permission to write to Firebase
                return Auth.$authWithPassword({ email: email, password: pass });
              })
              .then(function(user) {
                // create a user profile in our data store
                var ref = fbutil.ref('users', user.uid);
                return fbutil.handler(function(cb) {
                  // ref.set({email: email, name: name||firstPartOfEmail(email)}, cb);
                  ref.set({email: email}, cb);
                });
              })
              .then(function(/* user */) {
                // redirect to the home page
                $location.path('/home');
              }, function(err) {
                $scope.err = errMessage(err);
              });
        }
      };

      function assertValidAccountProps() {
        if( !$scope.email ) {
          $scope.err = 'Please enter an email address';
        }
        else if( !$scope.pass || !$scope.confirm ) {
          $scope.err = 'Please enter a password';
        }
        else if( $scope.createMode && $scope.pass !== $scope.confirm ) {
          $scope.err = 'The password you typed does not match what you typed for confirmation.';
        }
        return !$scope.err;
      }

      function errMessage(err) {
        return angular.isObject(err) && err.code? err.code : err + '';
      }

      function firstPartOfEmail(email) {
        return ucfirst(email.substr(0, email.indexOf('@'))||'');
      }

      function ucfirst (str) {
        // inspired by: http://kevin.vanzonneveld.net
        str += '';
        var f = str.charAt(0).toUpperCase();
        return f + str.substr(1);
      }

    }
  ]);

  app.config(['$routeProvider', function($routeProvider) {
    // require user to be authenticated before they can access this page
    // this is handled by the .whenAuthenticated method declared in
    // components/router/router.js
    $routeProvider.whenAuthenticated('/account', {
      templateUrl: 'account/account.html',
      controller: 'AccountCtrl'
    })
  }]);

})(angular);