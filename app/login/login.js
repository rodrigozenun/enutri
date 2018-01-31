"use strict";
angular.module('myApp.login', ['firebase.utils', 'firebase.auth', 'ngRoute','ngMaterial', 'ngMessages'])

    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/login', {
        controller: 'LoginCtrl',
        templateUrl: 'login/login.html'
      });
    }])


  

    .controller('LoginCtrl', ['$scope', 'Auth', '$location', 'fbutil', function($scope, Auth, $location, fbutil) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.message = null;
      $scope.error = null;

        $scope.login = function(email, pass) {
            $scope.err = null;
            Auth.$authWithPassword({ email: email, password: pass }, {rememberMe: false})
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
          $scope.message = "Please check your email for a message from EatWellUK with instructions of how to reset your password";
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
                  ref.set({email: email,userid:user.uid}, cb);
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


    }]);


