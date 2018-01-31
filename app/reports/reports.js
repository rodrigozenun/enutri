(function (angular) {
    "use strict";

    var app = angular.module('myApp.reports', ['firebase', 'firebase.utils', 'firebase.auth', 'ngRoute', 'ngMaterial','md.data.table','nvd3','nvd3ChartDirectives']);

    app.controller('ReportsCtrl', ['$scope', 'Auth', 'fbutil', 'user', '$location', '$firebaseArray', '$firebaseObject', 'HESScoreList','HESMessagesList','MessagesList', 'FoodsList', '$mdSidenav', '$mdBottomSheet','$mdToast','$mdDialog','$q',
        function($scope, Auth, fbutil, user, $location, $firebaseArray, $firebaseObject, HESScoreList,HESMessagesList, MessagesList, FoodsList, $mdSidenav, $mdBottomSheet, $mdToast, $mdDialog) {
            
            $scope.HESScore = HESScoreList;
            $scope.HESMessages = HESMessagesList;
            $scope.MessagesList = MessagesList;
            $scope.FoodsList = FoodsList;


            var refUser = fbutil.ref('users',user.uid);
            var refUserReports = fbutil.ref('reports', user.uid);
            var refUserFeedback = fbutil.ref('feedback', user.uid);
            
            refUser.on("value", function(snapshot){
                $scope.user = snapshot.val();
                $scope.height = snapshot.child('screening').child('height').val();
                $scope.minWeight = ($scope.height/100)*($scope.height/100)*18.5;
                $scope.maxWeight = ($scope.height/100)*($scope.height/100)*25;
                $scope.minWeightStones = kgToStonesLbs($scope.minWeight);
                $scope.maxWeightStones = kgToStonesLbs($scope.maxWeight);
            });

            function kgToStonesLbs(kilos) {
                var kilos = kilos;
                var exact = kilos/6.35029;
                var stones = Math.floor(exact);
                var lbs = Math.floor((exact - stones) * 14);
                stones=stones.toString();
                lbs=lbs.toString();
                var weightStonesString = stones + "st "+ lbs+ "lbs";
                return weightStonesString;

            }

            refUser.on("value", function(snapshot){
                if (snapshot.child('userid').exists()){
                    $scope.feedbackComplete = true;
                } else{
                    $scope.feedbackComplete = false;
                }
            });
            
            refUserReports.on("value", function(snapshot) {
                var numReports = snapshot.numChildren();
                var numReports = numReports.toString();
                $scope.numReports = numReports;
                getLastReport(numReports);
                getControlMessages(numReports);
                $scope.contributors = snapshot.child(numReports).child('HES').child('biggestContributors').val();
                $scope.currentWeight = snapshot.child(numReports).child('currentWeight').val();
                $scope.weightUnit = snapshot.child(numReports).child('weightUnit').val();
                $scope.currentWeightStones = kgToStonesLbs($scope.currentWeight);
                $scope.baeckeOverall = snapshot.child(numReports).child('baecke').child('overall').val()/15*100;
                $scope.baeckeSports = snapshot.child(numReports).child('baecke').child('overall').val()/5*100;
                $scope.baeckeLeisure = snapshot.child(numReports).child('baecke').child('overall').val()/5*100;
                $scope.progressIncrease = snapshot.child(numReports).child('HES').child('progress').child('increase').val();
                $scope.progressDecrease = snapshot.child(numReports).child('HES').child('progress').child('decrease').val();
                $scope.currentBMI =
                    $scope.currentWeight/($scope.height/100*$scope.height/100);
                $scope.weightData = {
                    "title": "kg",
                    "subtitle": "",
                    "ranges": [$scope.minWeight, $scope.maxWeight,$scope.maxWeight*1.5],
                    "measures": [$scope.currentWeight],
                    "markers": [$scope.currentWeight]
                };
                $scope.activityData = {
                    "title": "overall",
                    "subtitle": "score",
                    "ranges": [33,66,100],
                    "measures": [$scope.baeckeOverall],
                    "markers": [$scope.baeckeOverall]
                };
            });

            var userReports = $firebaseObject(fbutil.ref('reports', user.uid));
            userReports.$bindTo($scope, "reports");
            
            function getLastReport (reportID){
                var refUserLastReport = fbutil.ref('reports',user.uid, reportID, 'HES','scores');
                refUserLastReport.orderByValue().on("value", function(snapshot) {
                    var obj ={};
                    snapshot.forEach(function(child){
                        obj[child.key()] = child.val();
                    });
                    $scope.report = obj;
                });
                // checkProgress(reportID,$scope.report);
            }

            function getControlMessages(reportID){

                var objControl ={};
                var index = (reportID-1)*3;
                var OrderedComponents =["HES1VEG","HES6SUG","HES8PUFA","HES2FRUIT","HES3GRAINS","HES7MEAT","HES4DAIRY","HES5NUTS","HES9N3FAT"];
                for (var i=0;i<3;i++){
                    objControl[OrderedComponents[i+index]]=i
                }
                $scope.reportControl = objControl;

            }


            $scope.getWeightClass = function (currentWeight,language){

                if (currentWeight < $scope.minWeight ){
                    $scope.weightClass = "Underweight";
                    $scope.weightMessage = MessagesList[language].underWeight;
                    return MessagesList[language].underweightName;
                } else{
                    if (currentWeight < $scope.maxWeight ){
                        $scope.weightClass = "Healthy Weight";
                        $scope.weightMessage = MessagesList[language].healthyWeight;
                        return MessagesList[language].healthyWeightName;
                    } else{
                        if (currentWeight < $scope.maxWeight*30/25 ){
                            $scope.weightClass = "Overweight";
                            $scope.weightMessage = MessagesList[language].overWeight;
                            return MessagesList[language].overweightName;
                        } else{
                            if (currentWeight > $scope.maxWeight*30/25 ){
                                $scope.weightClass = "Obese";
                                $scope.weightMessage = MessagesList[language].obese;
                                return MessagesList[language].obeseName;
                            }
                        }
                    }
                }
            };

            $scope.getIntakeMessage = function (index,score,language){
                if (score<33){
                        return HESMessagesList[language][index].redIntake;
                    } else{
                        if(score<66){
                            return HESMessagesList[language][index].yellowIntake;
                        } else{
                            return HESMessagesList[language][index].greenIntake;
                        }
                    }
            };

            $scope.getActionMessage = function (index,score,language){
                if (score<33){
                    return HESMessagesList[language][index].redAction;
                } else{
                    if(score<66){
                        return HESMessagesList[language][index].yellowAction;
                    } else{
                        return HESMessagesList[language][index].greenAction;
                    }
                }
            };

            $scope.getHealthMessage = function (index,score, language){
                if (score<33){
                    return HESMessagesList[language][index].redHealth;
                } else{
                    if(score<66){
                        return HESMessagesList[language][index].yellowHealth;
                    } else{
                        return HESMessagesList[language][index].greenHealth;
                    }
                }
            };


            $scope.getControlMessage = function (index, language){
                    return HESMessagesList[language][index].controlGroup;
            };

            $scope.arrowUpDown = function(slopeType){
                var slopeType = slopeType;
                if (slopeType=="positive"){
                    return "arrow_upward";
                } else{
                    return "arrow_downward";
                }
            };

            $scope.getSubHeadline = function(slopeType, score, language){
                // Recommended Foods
                if (slopeType == "positive"){
                    if (score<33){
                        return MessagesList[language].consumptionVeryLow
                    } else{
                        if(score<66){
                            return MessagesList[language].consumptionMedium
                        } else{
                            return MessagesList[language].consumptionAdequate
                        }
                    }
                } else{
                    if (score<33){
                        return MessagesList[language].consumptionVeryHigh
                    } else{
                        if(score<66){
                            return MessagesList[language].consumptionModerate
                        } else{
                            return MessagesList[language].consumptionLow
                        }
                    }
                }
            };

            $scope.getSportsMessage = function(sportsScore, language){
                if (sportsScore<33){
                    return MessagesList[language].sportsRed;
                } else{
                    if(sportsScore<66){
                        return MessagesList[language].sportsYellow;
                    } else{
                        return MessagesList[language].sportsGreen;
                    }
                }
            };

            $scope.getLeisureMessage = function(leisureScore, language){
                if (leisureScore<33){
                    return MessagesList[language].leisureRed;
                } else{
                    if(leisureScore<66){
                        return MessagesList[language].leisureYellow;
                    } else{
                        return MessagesList[language].leisureGreen;
                    }
                }
            };

            $scope.showHelp = function(ev,title,content) {
                // Appending dialog to document.body to cover sidenav in docs app
                // Modal dialogs should fully cover application
                // to prevent interaction outside of dialog
                $mdDialog.show(
                    $mdDialog.alert()
                        .parent(angular.element(document.querySelector('#popupContainer')))
                        .clickOutsideToClose(true)
                        .title(title)
                        .textContent(content)
                        .ariaLabel('Alert Dialog')
                        .ok('OK')
                        .targetEvent(ev)
                );
            };

            $scope.showComponentExplanation = function (ev, componentName, componentDescription, componentContributors, FoodsList) {
                $scope.componentName= componentName;
                $scope.componentDescription= componentDescription;
                $scope.componentContributors= componentContributors;
                $scope.foods = FoodsList;
                if (componentContributors){
                    $scope.contributorsExist=true;
                } else{
                    $scope.contributorsExist=false;
                }

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };

                $mdDialog.show({
                    controller: function () { this.parent = $scope; },
                    locals: {parent: $scope},
                    bindToController: true,
                    controllerAs: 'ctrl',
                    templateUrl: 'menu/componentDialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
            }

            $scope.mostLikelyBrowser = "null";
            if (navigator.userAgent.search("Opera") >= 0) {
                $scope.mostLikelyBrowser = "Opera";
            }
            else if (navigator.userAgent.search("Firefox") >= 0) {
                $scope.mostLikelyBrowser = "Firefox";
            }
            else if (navigator.userAgent.search("Edge") >= 0) {
                $scope.mostLikelyBrowser = "Edge";
            }
            else if (navigator.userAgent.search("MSIE") >= 0) {
                $scope.mostLikelyBrowser = "MSIE";
            }
            else if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
                $scope.mostLikelyBrowser = "Safari";
            }
            else if (navigator.userAgent.search("Chrome") >= 0) {
                $scope.mostLikelyBrowser = "Chrome";
            }

        }
    ]);


    app.factory('HESScoreList', ['fbutil', '$firebaseObject', function(fbutil, $firebaseObject) {
        var ref = fbutil.ref('config','hesScore');
        return $firebaseObject(ref);
    }]);

    app.factory('HESMessagesList', ['fbutil', '$firebaseObject', function(fbutil, $firebaseObject) {
        var ref = fbutil.ref('config','hesMessages');
        return $firebaseObject(ref);
    }]);

    app.factory('MessagesList', ['fbutil', '$firebaseObject', function(fbutil, $firebaseObject) {
        var ref = fbutil.ref('config','messages');
        return $firebaseObject(ref);
    }]);

    app.factory('FoodsList', ['fbutil', '$firebaseObject', function(fbutil, $firebaseObject) {
        var ref = fbutil.ref('config','foods');
        return $firebaseObject(ref);
    }]);

    app.config(['$routeProvider', function($routeProvider) {
// require user to be authenticated before they can access this page
// this is handled by the .whenAuthenticated method declared in
// components/router/router.js
        $routeProvider.whenAuthenticated('/reports', {
            templateUrl: 'reports/reports.html',
            controller: 'ReportsCtrl'
        })
    }]);

})(angular);



