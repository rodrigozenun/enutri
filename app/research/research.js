(function (angular) {
    "use strict";

    var app = angular.module('myApp.research', ['firebase', 'firebase.utils', 'firebase.auth', 'ngRoute', 'ngMaterial','md.data.table']);

    app.controller('ResearchCtrl', ['$scope', 'Auth', 'fbutil', 'user', '$location', '$firebaseArray', '$firebaseObject', 'foodsList','surveyList','feedbackList', 'usersList', 'reportsList', '$q',
        function($scope, Auth, fbutil, user, $location, $firebaseArray, $firebaseObject, foodsList, surveyList, feedbackList, usersList, reportsList) {

            var foodsList = foodsList;
            var refConfig = fbutil.ref('config');
            refConfig.on("value", function(snapshot) {
                $scope.nutrients = snapshot.child('nutrients').val();
                var nutrientsList = snapshot.child('nutrients').child(0).val();
                var nutrientsArray = [];
                angular.forEach(nutrientsList,function(value,key){
                    if(key != "id"){
                        nutrientsArray.push(key);
                    }
                });
                $scope.nutrientsList =  nutrientsArray;

            });

            $scope.users = usersList;
            $scope.reportsList = reportsList;
            $scope.surveyList = surveyList;
            $scope.feedbackList = feedbackList;
            $scope.exportFFQInfo = exportFFQInfo;
            generateFFQInfo();
            var refUsers = new Firebase("https://xxxxxxxxx.firebaseio.com/users");
            
            function generateFFQInfo(){

                var countUsersOneCompletedFFQ = 0;
                var countUsersTwoCompletedFFQ = 0;
                var countUsersThreeCompletedFFQ = 0;
                var countUsersCompletedScreening = 0;
                var countUsersAcceptedScreening = 0;
                var countUsersWaitingEligibility = 0;

                $scope.countUsersOneCompletedFFQ = countUsersOneCompletedFFQ;
                $scope.countUsersTwoCompletedFFQ = countUsersTwoCompletedFFQ;
                $scope.countUsersThreeCompletedFFQ = countUsersThreeCompletedFFQ;
                $scope.countUsersCompletedScreening = countUsersCompletedScreening;
                $scope.countUsersAcceptedScreening = countUsersAcceptedScreening;
                $scope.countUsersWaitingEligibility = countUsersWaitingEligibility;

                var ffqHeader = ["userID","id","currentWeight","preFFQComplete","preFFQDate","preFFQTimestamp","lastFoodItem","FFQComplete","FFQCompletionDate","FFQStartTimestamp","FFQCompletionTimestamp",
                    "mostLikelyBrowser", "screenWidth","screenAvailWidth","screenHeight","screenAvailHeight","userAgent", "appName", "appCodeName","appVersion","platform","product","language","vendor"];
                var usersFfqCSV = ffqHeader + '\r\n';
                var refUsers = new Firebase("https://xxxxxxxxx.firebaseio.com/users");
                
                refUsers.once("value", function (snapshot) {

                    snapshot.forEach(function (childSnapshot) {
                        // childKey is the userid
                        var childKey = childSnapshot.key();

                        if (childSnapshot.child('state').child('screeningComplete').val() == "yes"){
                            countUsersCompletedScreening += 1;
                            $scope.countUsersCompletedScreening = countUsersCompletedScreening;
                        }
                        if (childSnapshot.child('state').child('screeningAccepted').val() == "yes"){
                            countUsersAcceptedScreening += 1;
                            $scope.countUsersAcceptedScreening = countUsersAcceptedScreening;
                        }

                        if (childSnapshot.child('group').val() == "waiting"){
                            countUsersWaitingEligibility += 1;
                            $scope.countUsersWaitingEligibility = countUsersWaitingEligibility;
                        }

                        var userFfqCount = childSnapshot.child('ffq').numChildren();
                        var countUserCompletedFFQ = 0;
                        var i=0;
                        var j=0;
                        for (i = 1; i <= userFfqCount; i++) {
                            var userFfqArray = [childKey];
                            for (j=1;j<ffqHeader.length;j++){
                                var item = childSnapshot.child('ffq').child(i).child(ffqHeader[j]).val();
                                // Replace comma in existing items for not breaking the CSV file
                                if (item != null){
                                    item = item.toString().replace(/,/g, " ");
                                }
                                userFfqArray.push(item);
                            }
                            if (childSnapshot.child('ffq').child(i).child('FFQComplete').val() == "yes"){
                                countUserCompletedFFQ += 1;
                            }
                            usersFfqCSV += userFfqArray + '\r\n';
                        }

                        switch (countUserCompletedFFQ) {
                            case 1:
                                countUsersOneCompletedFFQ += 1;
                                $scope.countUsersOneCompletedFFQ = countUsersOneCompletedFFQ;
                                break;
                            case 2:
                                countUsersTwoCompletedFFQ += 1;
                                $scope.countUsersTwoCompletedFFQ = countUsersTwoCompletedFFQ;
                                break;
                            case 3:
                                countUsersThreeCompletedFFQ += 1;
                                $scope.countUsersThreeCompletedFFQ = countUsersThreeCompletedFFQ;
                                break;
                        }
                    });
                });

                return usersFfqCSV;
            }

            $scope.redefineParticipantGroup = function (userID){
                var groups = ["control", "web"];
                var randomizer = Math.floor(Math.random() * groups.length);
                refUsers.child(userID).child('group').set(groups[randomizer]);
                refUsers.child(userID).child('report').set(groups[randomizer]);
                refUsers.child(userID).child('state').child('screeningAccepted').set("yes");
            };

            $scope.rejectParticipant = function (userID){
                refUsers.child(userID).child('group').set('rejected');
                refUsers.child(userID).child('state').child('screeningAccepted').set("no");
            };
            
            function exportFFQInfo () {
                var usersFfqCSV = generateFFQInfo();
                var uri = 'data:text/csv;charset=utf-8,' + escape(usersFfqCSV);
                window.open(uri);
            }

            $scope.exportFFQResults = function() {
                var ffqHeader = ["userID","FfqID","lastFoodItem","FFQCompletionDate"];
                for (var repeat=1; repeat<=3 ;repeat++){
                    for (var j=0;j<foodsList.length;j++){
                        ffqHeader.push(j);
                    }
                }
                var ffq = new Firebase("https://xxxxxxxxx.firebaseio.com/ffq");

                ffq.once("value", function (snapshot) {

                    var ffqCSV = ffqHeader + '\r\n';

                    snapshot.forEach(function (childSnapshot) {

                        var childKey = childSnapshot.key();
                        var ffqCount = childSnapshot.numChildren()-1;
                        var i = 0;
                        var j = 0;
                        for (i = 1; i <= ffqCount; i++) {
                            var ffqArray = [childKey,  childSnapshot.child(i).child('id').val(),childSnapshot.child(i).child('lastFoodItem').val(),childSnapshot.child(i).child('FFQCompletionDate').val()];
                            for (j = 0; j < foodsList.length; j++) {
                                var frequency = childSnapshot.child(i).child(j).child('freq').val();
                                ffqArray.push(frequency);
                            }
                            for (j = 0; j < foodsList.length; j++) {
                                var portion = childSnapshot.child(i).child(j).child('portion').val();
                                ffqArray.push(portion);
                            }
                            for (j = 0; j < foodsList.length; j++) {
                                var portion = childSnapshot.child(i).child(j).child('timestamp').val();
                                ffqArray.push(portion);
                            }
                            ffqCSV += ffqArray + '\r\n';
                        }
                    });

                    var uri = 'data:text/csv;charset=utf-8,' + escape(ffqCSV);
                    window.open(uri);
                });
            }

        }
    ]);

    app.factory('usersList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        var ref = fbutil.ref('users');
        return $firebaseArray(ref);
    }]);

    app.factory('surveyList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        var ref = fbutil.ref('survey');
        return $firebaseArray(ref);
    }]);

    app.factory('feedbackList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        var ref = fbutil.ref('feedback');
        return $firebaseArray(ref);
    }]);

    app.factory('reportsList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        var ref = fbutil.ref('reports');
        return $firebaseArray(ref);
    }]);

    app.factory('foodsList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        var ref = fbutil.ref('config','foods');
        return $firebaseArray(ref);
    }]);




    app.config(['$routeProvider', function($routeProvider) {
// require user to be authenticated before they can access this page
// this is handled by the .whenAuthenticated method declared in
// components/router/router.js
        $routeProvider.whenAuthenticated('/research', {
            templateUrl: 'research/research.html',
            controller: 'ResearchCtrl'
        })
    }]);

})(angular);