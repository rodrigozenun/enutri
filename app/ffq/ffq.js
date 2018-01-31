(function (angular) {
    "use strict";

    var app = angular.module('myApp.questionnaire', ['ngCookies','firebase', 'firebase.utils', 'firebase.auth', 'ngRoute', 'ngMaterial']);

    app.controller('FfqCtrl', ['$scope','$cookies', 'Auth', 'fbutil', 'user', '$location', '$firebaseArray', '$firebaseObject', 'foodsList', '$mdSidenav', '$mdBottomSheet','$mdToast','$mdDialog','$q',
        function($scope, $cookies, Auth, fbutil, user, $location, $firebaseArray, $firebaseObject, foodsList, $mdSidenav, $mdBottomSheet, $mdToast, $mdDialog) {

            $scope.heightUnit = 'feetInches';
            $scope.heightFeet = 5;
            $scope.heightInches = 5;
            $scope.height = 170;
            $scope.weightUnit = 'kg';
            $scope.showScreening = false;
            $scope.showScreeningWaiting = false;
            $scope.showScreeningRejected = false;
            $scope.showMessage = false;
            $scope.addEvent = false;

            $scope.showPersonalInfo = true;
            $scope.showOtherInfo = false;
            $scope.showPreFFQ = false;
            $scope.showBaecke = false;
            $scope.showBottomLeft = false;
            $scope.showBottomRight = false;

            // SUS Survey
            $scope.showsurvey = false;
            $scope.currentQuestionId = 0;
            $scope.showSurveyInstructions = true;
            var SUSComponents = [];
            SUSComponents[0] = 0;

            // Feedback Questionnaire
            $scope.showFeedback = false;
            $scope.currentFeedbackId = 0;
            $scope.showFeedbackInstructions = true;
            $scope.showFeedbackQuestions = false;
            $scope.showFirstFeedbackQuestions = false;

            $scope.foodsList = foodsList;

            var screening = $firebaseObject(fbutil.ref('users', user.uid,'screening'));
            var state = $firebaseObject(fbutil.ref('users', user.uid, 'state'));
            var utm = $firebaseObject(fbutil.ref('users', user.uid, 'utm'));
            var refFfq = fbutil.ref('ffq',user.uid);

            var refUser = fbutil.ref('users',user.uid);
            var refSurvey = fbutil.ref('survey',user.uid);
            var refReports = fbutil.ref('reports',user.uid);
            var refFeedback = fbutil.ref('feedback',user.uid);
            var refConfig = fbutil.ref('config');

            refConfig.on("value", function(snapshot) {
                $scope.foods = snapshot.child('foods').val();
                $scope.nutrients = snapshot.child('nutrients').val();
                var nutrientsList = snapshot.child('nutrients').child(0).val();
                var nutrientsArray = [];
                angular.forEach(nutrientsList,function(value,key){
                    if(key != "id"){
                        nutrientsArray.push(key);
                    }
                });
                $scope.nutrientsList =  nutrientsArray;

                $scope.HES = snapshot.child('hes').val();
                var HESList = snapshot.child('hes').child(0).val();
                var HESArray = [];
                angular.forEach(HESList,function(value,key){
                    if(key != "id"){
                        HESArray.push(key);
                    }
                });
                $scope.HESList =  HESArray;
                
                $scope.HESScore = snapshot.child('hesScore').val();

            });

            $scope.showConsentForm = function (ev) {
                $mdDialog.show({
                    controller: ConsentController,
                    templateUrl: 'menu/consentDialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:false
                })
                    .then(function(answer) {
                        $scope.consentResponse = answer;
                        $scope.showConsent = false;
                        state.consentResponse= answer;
                        state.consentTimestamp= new Date().getTime();
                        state.$save();
                    }, function() {
                        state.consentResponse= answer;
                        state.consentTimestamp= new Date().getTime();
                        state.$save();
                        $scope.showConsent = true;

                    });
            }

            function ConsentController($scope, $mdDialog) {
                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.answer = function(answer) {
                    $mdDialog.hide(answer);
                };
            }

            state.$bindTo($scope, "state");
            utm.$bindTo($scope, "utm");
            screening.$bindTo($scope, "user");

            var currentDate = new Date();
            var currentDateFormatted = currentDate.getFullYear() +"-"+ (currentDate.getMonth()+1) +"-"+ currentDate.getDate();
            var currentDateFormattedDDMMYYYY = currentDate.getDate() +"/"+ (currentDate.getMonth()+1) +"/"+ currentDate.getFullYear();


            refUser.on("value", function(snapshot) {

                var FFQCount = snapshot.child('ffq').numChildren();
                console.log('ffq count', FFQCount);
                var FFQCompleteCount = snapshot.child('state').child('FFQCompleteCount').val();
                $scope.FFQId = FFQCount+1;
                $scope.FFQCompleteCount = FFQCompleteCount;
                $scope.reportID = FFQCompleteCount+1;

                var FfqValidity = 24;//hours
                var FfqInterval = 41;//days
                var studyDuration = 77;//days
                var ffqRestored = false;

                if (snapshot.child('state').child('consentResponse').val() == 'agree'){
                    if (snapshot.child('state').child('screeningComplete').exists()){
                        if (snapshot.child('state').child('screeningAccepted').val() == 'yes'){
                            $scope.gender = snapshot.child('screening').child('gender').val();
                            if(FFQCount != 0){
                                if ($scope.FFQCompleteCount < 3){
                                    // Searching for valid FFQ to be restored
                                    for (var i=1;i<=FFQCount+1;i++){
                                        // Has this FFQ started during the last 24 hours?
                                        if (new Date().getTime() - snapshot.child('ffq').child(i).child('preFFQTimestamp').val() < (1000*60*60*FfqValidity)){
                                            // Is it complete?
                                            if (snapshot.child('ffq').child(i).child('FFQComplete').exists()){
                                                $scope.showMessage = true;
                                                $scope.showPreFFQ = false;
                                                $scope.ffqMessage = 'MESSAGE_TODAY_COMPLETED';
                                                if (FFQCompleteCount == 1 && snapshot.child('state').child('surveyComplete').val() == "no"){
                                                    $scope.showSurvey = true;
                                                }
                                                console.log("completeffqcount", FFQCompleteCount);
                                                console.log("delayed", (snapshot.child('state').child('lastFFQCompletionTimestamp').val() - snapshot.child('state').child('firstFFQCompletionTimestamp').val() > (1000*60*60*24*studyDuration)));
                                                if(FFQCompleteCount == 2 && (snapshot.child('state').child('lastFFQCompletionTimestamp').val() - snapshot.child('state').child('firstFFQCompletionTimestamp').val() > (1000*60*60*24*studyDuration))) {
                                                    refUser.child('state').child('nextFFQDueDate').set("Finished with 2");
                                                    if (snapshot.child('state').child('feedbackComplete').val() == "yes"){
                                                        $scope.showMessage = true;
                                                        $scope.ffqMessage = 'MESSAGE_COMPLETED';
                                                    }else{
                                                        $scope.showFeedback = true;
                                                    }
                                                }
                                                break;
                                            } else{
                                                $scope.FFQId = snapshot.child('ffq').child(i).child('id').val();
                                                $scope.currentFoodItem = snapshot.child('ffq').child(i).child('lastFoodItem').val()+1;
                                                $scope.freqSelected = "Not in the last month";
                                                $scope.portionSelected = "None";
                                                $scope.freqDay = 0;
                                                $scope.showPortionSelection = false;
                                                $scope.showFFQ = true;
                                                $scope.showBottomRight = true;
                                                if (snapshot.child('ffq').child(i).child('lastFoodItem').val() != -1){
                                                    $scope.showBottomLeft = true;
                                                }
                                                var ffqRestored = true;
                                                console.log("today ffq", FFQCount);
                                                break;
                                            }
                                        }
                                    }

                                    if(ffqRestored == false){

                                        // Analyzing the complete FFQs
                                        if (FFQCompleteCount != 0 ){
                                            var nextFfqDate = new Date();
                                            if((FFQCompleteCount == 1 && (new Date().getTime() - snapshot.child('state').child('firstFFQCompletionTimestamp').val() > (1000*60*60*24*FfqInterval))) || (FFQCompleteCount == 2 && (new Date().getTime() - snapshot.child('state').child('firstFFQCompletionTimestamp').val() > (1000*60*60*24*studyDuration)))){
                                                if(FFQCompleteCount == 2 && (snapshot.child('state').child('lastFFQCompletionTimestamp').val() - snapshot.child('state').child('firstFFQCompletionTimestamp').val() > (1000*60*60*24*studyDuration))) {
                                                    refUser.child('state').child('nextFFQDueDate').set("Finished with 2");
                                                    refUser.child('report').set("web");
                                                    if (snapshot.child('state').child('feedbackComplete').val() == "yes"){
                                                        $scope.showMessage = true;
                                                        $scope.ffqMessage = 'MESSAGE_COMPLETED';
                                                    }else{
                                                        $scope.showMessage = false;
                                                        $scope.showFeedback = true;
                                                    }
                                                } else{
                                                    $scope.showPreFFQ = true;
                                                    $scope.showWeight = true;
                                                    $scope.FFQId = FFQCount+1;
                                                    $scope.currentFoodItem = 0;
                                                    $scope.freqSelected = "Not in the last month";
                                                    $scope.portionSelected = "None";
                                                    $scope.freqDay = 0;
                                                    $scope.showPortionSelection = false;
                                                    $scope.showFFQ = false;
                                                }

                                            } else{
                                                if (FFQCompleteCount == 1 && snapshot.child('state').child('surveyComplete').val() == "no"){
                                                    $scope.showMessage = false;
                                                    $scope.ffqMessage = false;
                                                    $scope.showSurvey = true;
                                                    $scope.showSurveyInstructions = true;
                                                    console.log("show survey");
                                                } else{
                                                    if(FFQCompleteCount == 1){
                                                        nextFfqDate.setTime(snapshot.child('state').child('firstFFQCompletionTimestamp').val()+(1000*60*60*24*FfqInterval));
                                                    }
                                                    if(FFQCompleteCount == 2){
                                                        nextFfqDate.setTime(snapshot.child('state').child('firstFFQCompletionTimestamp').val()+(1000*60*60*24*studyDuration));
                                                    }
                                                    if(FFQCompleteCount < 3){
                                                        $scope.nextFfqDateFormatted = nextFfqDate.getDate() +"/"+ (nextFfqDate.getMonth()+1) +"/"+ nextFfqDate.getFullYear();
                                                        $scope.nextFfqDateEvent = (nextFfqDate.getDate()+1) +"/"+ (nextFfqDate.getMonth()+1) +"/"+ nextFfqDate.getFullYear();
                                                        refUser.child('state').child('nextFFQDueDate').set($scope.nextFfqDateFormatted);
                                                        $scope.showMessage = true;
                                                        $scope.ffqMessage = 'MESSAGE_WAIT';
                                                        $scope.addEvent = true;
                                                        addeventatc.refresh();
                                                        console.log("show wait");
                                                    }

                                                }
                                            }
                                        } else{
                                            // Present a new ffq
                                            $scope.FFQId = FFQCount+1;
                                            $scope.currentFoodItem = 0;
                                            $scope.freqSelected = "Not in the last month";
                                            $scope.portionSelected = "None";
                                            $scope.freqDay = 0;
                                            $scope.showPortionSelection = false;
                                            $scope.showFFQ = false;
                                            $scope.showPreFFQ = true;
                                            $scope.showWeight = true;
                                            console.log("no valid ffq found", FFQCount);
                                        }

                                    }
                                } else{
                                    if (FFQCompleteCount == 1 && snapshot.child('state').child('surveyComplete').val() == "no"){
                                        $scope.showSurvey = true;
                                    }
                                    if (FFQCompleteCount == 3 && snapshot.child('state').child('feedbackComplete').val() == "no"){
                                        $scope.showFeedback = true;
                                    }
                                    if (FFQCompleteCount == 3){
                                        refUser.child('state').child('nextFFQDueDate').set("Finished");
                                        if (snapshot.child('state').child('feedbackComplete').val() == "yes"){
                                            $scope.showMessage = true;
                                            $scope.ffqMessage = 'MESSAGE_COMPLETED';
                                        }else{
                                            $scope.showFeedback = true;
                                        }
                                    }

                                }
                            } else {
                                //Present the PreFFQ for the first FFQ
                                $scope.FFQId = FFQCount+1;
                                $scope.currentFoodItem = 0;
                                $scope.freqSelected = "Not in the last month";
                                $scope.freqDay = 0;
                                $scope.portionSelected = "None";
                                $scope.showPortionSelection = false;
                                $scope.showPortionSelection = false;
                                $scope.showScreeningWaiting = false;
                                $scope.showScreeningRejected = false;
                                $scope.showFFQ = false;
                                $scope.showBaecke = false;
                                $scope.showPreFFQ = true;
                                $scope.showWeight = true;
                                console.log("first ffq", FFQCount);
                            }

                        } else{
                            if (snapshot.child('group').val() == 'rejected'){
                                $scope.showScreening = false;
                                $scope.showScreeningWaiting = false;
                                $scope.showScreeningRejected = true;
                            } else{
                                //Present "Wait for confirmation"
                                $scope.showScreening = false;
                                $scope.showScreeningWaiting = true;
                            }
                        }

                    } else{
                        //Present the Personal Info (Screening)
                        $scope.showScreening = true;
                    }
                } else{
                    if (snapshot.child('state').child('consentResponse').val() == 'disagree'){
                        $scope.showConsent = true;
                    } else{
                        $scope.showConsentForm();
                    }
                }
            });

            function defineParticipantGroup (acceptance){

                var groups = ["control", "web"];
                var randomizer = Math.floor(Math.random() * groups.length);
                if (acceptance == "accepted"){
                    refUser.child('group').set(groups[randomizer]);
                    refUser.child('report').set(groups[randomizer]);
                    refUser.child('state').child('screeningAccepted').set("yes");
                }

                if (acceptance == "waiting" || acceptance == "rejected"){
                    refUser.child('group').set(acceptance);
                    refUser.child('report').set(groups[randomizer]);
                    refUser.child('state').child('screeningAccepted').set("no");
                }
            }

            $scope.savePersonalInformation = function() {


                // screening.breakfastDesc = "";
                screening.notgoodhealthDesc = "";
                screening.foodallergyDesc = "";
                screening.illnessesDesc = "";
                screening.medicationDesc = "";
                screening.methabolicdisorderDesc = "";
                screening.medicalinformationDesc = "";
                screening.dietaryreqDesc = "";
                $scope.user.breakfast = false;
                // $scope.user.snacksmeals = false;
                // $scope.user.threeMealsDay = false;
                $scope.user.notgoodhealth = false;
                $scope.user.lactose = false;
                $scope.user.foodallergy = false;
                $scope.user.diabetes = false;
                $scope.user.vegan = false;
                $scope.user.pregnant = false;
                $scope.user.methabolicdisorder = false;
                $scope.user.illnesses = false;
                $scope.user.medication = false;
                $scope.user.medicalinformation = false;
                $scope.user.livinguk = false;
                $scope.user.consultation = false;
                $scope.user.dietaryreq = false;

                screening.$save();

                $scope.showPersonalInfo = false;
                $scope.showOtherInfo = true;

            };

            $scope.saveOtherInformation = function() {

                utm.source = "null";
                utm.medium = "null";
                utm.campaign = "null";
                utm.term= "null";
                utm.content= "null";
                if ($cookies.get('utm_source')){
                    utm.source = $cookies.get('utm_source');
                }
                if ($cookies.get('utm_medium')){
                    utm.medium = $cookies.get('utm_medium');
                }
                if ($cookies.get('utm_campaign')){
                    utm.campaign = $cookies.get('utm_campaign');
                }
                if ($cookies.get('utm_term')){
                    utm.term = $cookies.get('utm_term');
                }
                if ($cookies.get('utm_source')){
                    utm.content = $cookies.get('utm_content');
                }
                utm.$save();

                if($scope.heightUnit == 'feetInches'){
                    screening.height = $scope.heightFeet*30.48 + $scope.heightInches*2.54;
                }

                if($scope.heightUnit == 'cm'){
                    screening.height = $scope.height;
                }


                // screening.dateofbirth = screening.bdateyear + "-" + screening.bdatemonth.id + "-" + screening.bdateday;

                // Formating Date of Birth, previously saved
                // screening.dateofbirth = screening.bdateyear + "-" + screening.bdatemonth.id + "-" + screening.bdateday;
                // screening.breakfast = $scope.user.breakfast;
                // screening.snacksmeals = $scope.user.snacksmeals;
                // screening.threeMealsDay = $scope.user.threeMealsDay;
                screening.notgoodhealth = $scope.user.notgoodhealth;
                screening.lactose = $scope.user.lactose;
                screening.foodallergy = $scope.user.foodallergy;
                screening.diabetes = $scope.user.diabetes;
                screening.vegan = $scope.user.vegan;
                screening.pregnant = $scope.user.pregnant;
                screening.methabolicdisorder = $scope.user.methabolicdisorder;
                screening.illnesses = $scope.user.illnesses;
                screening.medication = $scope.user.medication;
                screening.medicalinformation = $scope.user.medicalinformation;
                screening.livinguk = $scope.user.livinguk;
                screening.consultation = $scope.user.consultation;
                screening.dietaryreq = $scope.user.dietaryreq;

                screening.screeningDate = currentDateFormatted;
                screening.screeningTimestamp = new Date().getTime();
                screening.$save();

                state.screeningComplete = "yes";
                state.surveyComplete = "no";
                state.FFQCompleteCount = 0;
                $scope.showScreening = false;
                state.$save();


                if ($scope.user.lactose == true || $scope.user.foodallergy == true || $scope.user.diabetes == true || $scope.user.livinguk == true || $scope.user.consultation == true ||  $scope.user.pregnant == true ||  $scope.user.vegan == true){
                    defineParticipantGroup ("rejected");
                } else{
                    if ($scope.user.notgoodhealth == true || $scope.user.methabolicdisorder == true || $scope.user.illnesses == true ||  $scope.user.medication == true || $scope.user.dietaryreq  == true){
                        defineParticipantGroup ("waiting");
                    } else{
                        defineParticipantGroup ("accepted");
                    }
                }



            };

            var nextFoodItem = function(reportID, FFQId, currentFoodItem){

                if ($scope.portionSelected != "Not Selected") {

                    var ffqResult = {};
                    ffqResult['portion'] = $scope.portionSelected;
                    ffqResult['freq'] = $scope.freqSelected;
                    ffqResult['freqDay'] = $scope.freqDay;
                    ffqResult['timestamp'] = new Date().getTime();

                    switch ($scope.portionSelected) {
                        case "None":
                            ffqResult['gDay'] = 0;
                            break;
                        case "A":
                            ffqResult['gDay'] = $scope.foods[currentFoodItem].pSmall * $scope.freqDay;
                            break;
                        case "B":
                            ffqResult['gDay'] = $scope.foods[currentFoodItem].pMedium * $scope.freqDay;
                            break;
                        case "C":
                            ffqResult['gDay'] = $scope.foods[currentFoodItem].pLarge * $scope.freqDay;
                            break;
                    }

                    refFfq.child(FFQId).child(currentFoodItem).set(ffqResult);
                    refFfq.child(FFQId).child('lastFoodItem').set(currentFoodItem);
                    refUser.child('ffq').child(FFQId).child('lastFoodItem').set(currentFoodItem);

                    if (currentFoodItem == 0){
                        $scope.showBottomLeft = true;
                    }

                    if (currentFoodItem == foodsList.length - 1) {
                        refUser.child('ffq').child(FFQId).child('FFQComplete').set("yes");
                        refUser.child('ffq').child(FFQId).child('FFQCompletionTimestamp').set(new Date().getTime());
                        refUser.child('ffq').child(FFQId).child('FFQCompletionDate').set(currentDateFormatted);

                        if ($scope.FFQCompleteCount == 0) {
                            refUser.child('state').child('firstFFQCompletionTimestamp').set(new Date().getTime());
                            refUser.child('state').child('firstFFQCompletionDate').set(currentDateFormatted);
                        }

                        refUser.child('state').child('lastFFQCompleteId').set(FFQId);
                        refUser.child('state').child('lastFFQCompletionTimestamp').set(new Date().getTime());
                        refUser.child('state').child('lastFFQCompletionDate').set(currentDateFormatted);

                        refUser.child('state').child('FFQCompleteCount').set($scope.FFQCompleteCount+1);
                        if ($scope.FFQCompleteCount == 2){
                            refUser.child('state').child('nextFFQDueDate').set("Finished");
                        } else{
                            // refUser.child('state').child('nextFFQDueDate').set($scope.nextFfqDateFormatted);
                        }

                        refFfq.child(FFQId).child('FFQComplete').set("yes");
                        refFfq.child(FFQId).child('FFQCompletionDate').set(currentDateFormatted);
                        $scope.showFFQ = false;
                        $scope.showPreFFQ = false;
                        $scope.showBottomLeft = false;
                        $scope.showBottomRight = false;
                        calculateNutrients(FFQId, reportID);
                        calculateHESComponents(FFQId, reportID);
                        calculateHESScores(FFQId, reportID);
                        reportBaecke(FFQId, reportID);

                    } else {
                        var nextItem = currentFoodItem + 1;
                    }
                    updateFoodItem(FFQId, nextItem);

                } else{
                    $scope.showSimpleToast('Select Portion Size!');
                    $scope.showPortionSelection = true;
                }
            };

            $scope.nextFoodItem = nextFoodItem;

            $scope.previousFoodItem = function(FFQId, currentFoodItem){

                if ($scope.portionSelected != "Not Selected"){

                    var ffqResult = {};
                    ffqResult[ 'portion' ] = $scope.portionSelected;
                    ffqResult[ 'freq' ] = $scope.freqSelected;
                    ffqResult['freqDay'] = $scope.freqDay;
                    ffqResult['timestamp'] = new Date().getTime();

                    switch ($scope.portionSelected) {
                        case "None":
                            ffqResult['gDay'] = 0;
                            break;
                        case "A":
                            ffqResult['gDay'] = $scope.foodsList[currentFoodItem].pSmall * $scope.freqDay;
                            break;
                        case "B":
                            ffqResult['gDay'] = $scope.foodsList[currentFoodItem].pMedium * $scope.freqDay;
                            break;
                        case "C":
                            ffqResult['gDay'] = $scope.foodsList[currentFoodItem].pLarge * $scope.freqDay;
                            break;
                    }

                    refFfq.child(FFQId).child(currentFoodItem).set(ffqResult);
                    refUser.child('ffq').child(FFQId).child('lastFoodItem').set(currentFoodItem-2);

                    if (currentFoodItem != 0){
                        var nextItem = currentFoodItem -1;
                    }
                    if (currentFoodItem == 1){
                        $scope.showBottomLeft = false;
                    }
                    updateFoodItem(FFQId, nextItem);
                } else{
                    $scope.showSimpleToast('Select Portion Size!');
                    $scope.showPortionSelection = true;
                }
            };

            var updateFoodItem = function(FFQId, nextItem){
                $scope.currentFoodItem = nextItem;

                if (nextItem < foodsList.length){
                    refFfq.on("value", function(snapshot) {
                        $scope.portionSelected = snapshot.child(FFQId).child(nextItem).child('portion').val();
                        $scope.freqSelected = snapshot.child(FFQId).child(nextItem).child('freq').val();
                        $scope.freqDay = snapshot.child(FFQId).child(nextItem).child('freqDay').val();

                        if ($scope.portionSelected == "None"){
                            $scope.showPortionSelection = false;
                        } else{
                            $scope.showPortionSelection = true;
                        }
                    });
                }


            };

            var calculateNutrients = function(FFQId, reportID){

                refFfq.on("value", function(snapshot) {
                    for (var j in $scope.nutrientsList){
                        var sumNutrient = 0;
                        for (var i=0;i<foodsList.length;i++){
                            var nutri = $scope.nutrientsList[j];
                            sumNutrient = sumNutrient + $scope.nutrients[i][nutri] / 100 * snapshot.child(FFQId).child(i).child('gDay').val();
                        }
                        refUser.child('ffq').child(FFQId).child('nutrients').child(nutri).set(sumNutrient);
                        refReports.child(reportID).child('nutrients').child(nutri).set(sumNutrient);
                    }
                });
                refUser.on("value", function(snapshot) {
                    $scope.energy = snapshot.child('ffq').child(FFQId).child('nutrients').child('kcal').val();
                });
            };

            var calculateHESComponents = function(FFQId, reportID){

                refFfq.on("value", function(snapshot) {
                    for (var j in $scope.HESList){
                        var sumComponent = 0;
                        var HEScontribution =0;
                        for (var i=0;i<foodsList.length;i++){
                            var component = $scope.HESList[j];
                            if(snapshot.child(FFQId).child(i).child('gDay').val()>0){
                                HEScontribution = (($scope.HES[i][component] / 100) * snapshot.child(FFQId).child(i).child('gDay').val());
                                sumComponent = sumComponent + HEScontribution;
                                refReports.child(reportID).child('HES').child('contributions').child(component).child(i).set(HEScontribution);

                            } else {
                                refReports.child(reportID).child('HES').child('contributions').child(component).child(i).set(0);
                            }
                        }
                        if ($scope.HESScore[component].percentEnergy == "yes"){
                            sumComponent = sumComponent / $scope.energy * 100;
                        }
                        if (isNaN(sumComponent)){
                            refUser.child('ffq').child(FFQId).child('HES').child('values').child(component).set(0);
                            refReports.child(reportID).child('HES').child('values').child(component).set(0);

                        } else{
                            refUser.child('ffq').child(FFQId).child('HES').child('values').child(component).set(sumComponent);
                            refReports.child(reportID).child('HES').child('values').child(component).set(sumComponent);
                        }

                    }
                });
            };

            var calculateHESScores = function(FFQId, reportID){

                refUser.on("value", function(snapshot) {
                    var HESComponents = snapshot.child('ffq').child(FFQId).child('HES').child('values').val();
                    var currentWeight = snapshot.child('ffq').child(FFQId).child('currentWeight').val();
                    var weightUnit = snapshot.child('ffq').child(FFQId).child('weightUnit').val();

                    var sumWeight = 0;

                    for (var component in $scope.HESScore){
                        var weight = $scope.HESScore[component].weight;
                        sumWeight = sumWeight + weight;
                    }

                    var HES = 0;
                    for (var component in $scope.HESScore){
                        var slopeType = $scope.HESScore[component].slopeType;
                        var moderateScore = $scope.HESScore[component].moderateScore;
                        var value = HESComponents[component];
                        var weight = $scope.HESScore[component].weight;
                        var score = 0;

                        if($scope.gender == "male"){
                            var slopeStart = $scope.HESScore[component].slopeStartMale;
                            var slopeEnd = $scope.HESScore[component].slopeEndMale;
                            var moderate = $scope.HESScore[component].moderateMale;
                        } else{
                            var slopeStart = $scope.HESScore[component].slopeStartFemale;
                            var slopeEnd = $scope.HESScore[component].slopeEndFemale;
                            var moderate = $scope.HESScore[component].moderateFemale;
                        }

                        if(slopeType == "positive"){
                            if (value < slopeStart){
                                score = 0;
                            } else{
                                if (value > slopeEnd){
                                    score = 10;
                                } else{
                                    score = (value - slopeStart)/(slopeEnd-slopeStart)*10;
                                }
                            }
                        } else{
                            if (value < moderate){
                                score = moderateScore;
                            } else{
                                if(value < slopeStart){
                                    score = 10;
                                } else{
                                    if (value < slopeEnd){
                                        score = (slopeEnd - value)/(slopeEnd-slopeStart)*10;
                                    } else{
                                        score = 0;
                                    }
                                }
                            }
                        }

                        HES = HES + score * weight;
                        score = Math.round(score*10);
                        refUser.child('ffq').child(FFQId).child('HES').child('scores').child(component).set(score);
                        refReports.child(reportID).child('HES').child('scores').child(component).set(score);
                    }
                    HES = Math.round(HES/sumWeight*10);
                    refUser.child('ffq').child(FFQId).child('HES').child('overallScore').set(HES);
                    refReports.child(reportID).child('HES').child('overallScore').set(HES);
                    refReports.child(reportID).child('id').set(reportID);
                    refReports.child(reportID).child('ffqID').set(FFQId);
                    refReports.child(reportID).child('currentWeight').set(currentWeight);
                    refReports.child(reportID).child('weightUnit').set(weightUnit);
                    refReports.child(reportID).child('reportDate').set(currentDateFormattedDDMMYYYY);
                    refReports.child(reportID).child('userid').set(user.uid);
                    lowestHES(reportID);
                    CalculateBiggestHESContributions(reportID);

                    if (reportID > 1){
                        checkProgress(reportID);
                    }

                    if (reportID == 3){
                        refUser.child('report').set("web");
                    }

                });
            };


            function checkProgress(reportID){
                var reportID = reportID.toString();

                var refUserLastReport = fbutil.ref('reports',user.uid, reportID, 'HES','scores');
                refUserLastReport.orderByValue().on("value", function(snapshot) {
                    var lastReport ={};
                    snapshot.forEach(function(child){
                        lastReport[child.key()] = child.val();
                    });
                    $scope.report = lastReport;
                });

                var previousReportID = reportID-1;
                previousReportID=previousReportID.toString();
                var refUserPreviousReport = fbutil.ref('reports',user.uid, previousReportID, 'HES','scores');

                refUserPreviousReport.orderByValue().on("value", function(snapshot) {
                    var biggestIncrease = 10;
                    var biggestDecrease = -20;
                    snapshot.forEach(function(child){
                        var diff = parseInt($scope.report[child.key()] - child.val());


                        if (diff > biggestIncrease){
                            biggestIncrease = $scope.report[child.key()] - child.val();
                            refReports.child(reportID).child('HES').child('progress').child('increase').set(child.key());
                        }
                        if (diff < biggestDecrease){
                            biggestDecrease = $scope.report[child.key()] - child.val();
                            refReports.child(reportID).child('HES').child('progress').child('decrease').set(child.key());
                        }
                    });
                });

            };

            var lowestHES = function(reportID){

                refReports.child(reportID).child('HES').child('scores').orderByValue().limitToFirst(3).on("value", function(snapshot) {
                    var obj={};
                    snapshot.forEach(function(child){
                        obj[child.key()] = child.val();
                        refReports.child(reportID).child('HES').child('lowest').child(child.key()).set(child.val());
                    });
                });

            };

            var CalculateHESContributions = function (reportID, index){
                    refReports.child(reportID).child('HES').child('contributions').child(index).orderByValue().limitToLast(10).on("value", function (snapshot) {
                        var obj = {};
                        var j = 9;
                        snapshot.forEach(function (child) {
                            if (child.val()>0){
                                refReports.child(reportID).child('HES').child('biggestContributors').child(index).child(j).set(child.key());
                            }
                            j=j-1;
                        });
                    });
            };

            var CalculateBiggestHESContributions = function(reportID){

                var list = ["HES1VEG","HES6SUG","HES8PUFA","HES2FRUIT","HES3GRAINS","HES7MEAT","HES4DAIRY","HES5NUTS","HES9N3FAT","HES10SOD","HES11ALCO"];
                for (var i in list) {
                CalculateHESContributions(reportID, list[i]);
                }
            };

            var reportBaecke = function(FFQId, reportID){

                refFfq.on("value", function(snapshot) {
                    refReports.child(reportID).child('baecke').child('overall').set(snapshot.child(FFQId).child('baecke').child('overall').val());
                    refReports.child(reportID).child('baecke').child('sports').set(snapshot.child(FFQId).child('baecke').child('sports').val());
                    refReports.child(reportID).child('baecke').child('leisure').set(snapshot.child(FFQId).child('baecke').child('leisure').val());
                    refReports.child(reportID).child('baecke').child('work').set(snapshot.child(FFQId).child('baecke').child('work').val());
                });
            };


            $scope.selectFrequency = function (freqSelected, freqDay, currentFoodItem) {
                $scope.freqSelected = freqSelected;
                $scope.currentFoodItem= currentFoodItem;
                $scope.freqDay= freqDay;

                if ($scope.freqSelected =="Not in the last month"){
                    $scope.showPortionSelection = false;
                    $scope.portionSelected = "None";
                    $scope.freqDay = 0;
                    nextFoodItem($scope.reportID, $scope.FFQId, $scope.currentFoodItem);
                } else{
                    $mdBottomSheet.show({
                        controllerAs  : "cp",
                        templateUrl   : 'ffq/BottomSheetTemplate.html',
                        controller    : [ '$mdBottomSheet', BottomSheetController],
                        parent        : angular.element(document.getElementById('content'))
                    }).then(function(clickedItem) {
                        $scope.portionSelected = clickedItem.name;
                        nextFoodItem($scope.reportID, $scope.FFQId, $scope.currentFoodItem);
                    });
                    if($scope.portionSelected = "None"){
                        $scope.portionSelected = "Not Selected";
                    }
                    // $scope.showPortionSelection = true;

                }


                function BottomSheetController( $mdBottomSheet ) {
                    this.freqSelected = freqSelected;
                    this.freqDay = freqDay;
                    this.currentFoodItem = currentFoodItem;
                    this.portions = [
                        { name: 'A', image_url: "assets/images/foods/food-small-"},
                        { name: 'B', image_url: "assets/images/foods/food-medium-"},
                        { name: 'C', image_url: "assets/images/foods/food-large-"},
                    ];

                    this.selectPortion = function(portion) {

                        // so just hide the bottomSheet
                        $mdBottomSheet.hide(portion);
                    };
                }
            }

            var savePreFFQ = function(FFQId){
                var FFQId = FFQId;
                //initialize the firebase children with never and none
                var ffqResult = {};
                for (var i=0;i<foodsList.length;i++){
                    var ffqResult = {};
                    ffqResult[ 'portion' ] = "None";
                    ffqResult[ 'freq' ] = "Not in the last month";
                    ffqResult[ 'freqDay' ] = 0;
                    refFfq.child(FFQId).child(i).set(ffqResult);
                }

                refFfq.child(FFQId).child('id').set(FFQId);
                refFfq.child('userid').set(user.uid);
                refUser.child('ffq').child(FFQId).child('lastFoodItem').set(-1);
                refUser.child('ffq').child(FFQId).child('id').set(FFQId);
                refUser.child('ffq').child(FFQId).child('FFQStartTimestamp').set(new Date().getTime());

                // Save Personal result and navigator info

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

                refFfq.child(FFQId).child('currentWeight').set($scope.currentWeight);
                refFfq.child(FFQId).child('weightUnit').set($scope.weightUnit);
                refFfq.child(FFQId).child('preFFQComplete').set("yes");
                refFfq.child(FFQId).child('preFFQDate').set(currentDateFormatted);
                refFfq.child(FFQId).child('preFFQTimestamp').set(new Date().getTime());
                refFfq.child(FFQId).child('appName').set(navigator.appName);
                refFfq.child(FFQId).child('appCodeName').set(navigator.appCodeName);
                refFfq.child(FFQId).child('appVersion').set(navigator.appVersion);
                refFfq.child(FFQId).child('userAgent').set(navigator.userAgent);
                refFfq.child(FFQId).child('platform').set(navigator.platform);
                refFfq.child(FFQId).child('product').set(navigator.product);
                refFfq.child(FFQId).child('language').set(navigator.language);
                refFfq.child(FFQId).child('vendor').set(navigator.vendor);
                refFfq.child(FFQId).child('mostLikelyBrowser').set($scope.mostLikelyBrowser);
                refFfq.child(FFQId).child('screenWidth').set(screen.width);
                refFfq.child(FFQId).child('screenAvailWidth').set(screen.availWidth);
                refFfq.child(FFQId).child('screenHeight').set(screen.height);
                refFfq.child(FFQId).child('screenAvailHeight').set(screen.availHeight);

                refUser.child('ffq').child(FFQId).child('currentWeight').set($scope.currentWeight);
                refUser.child('ffq').child(FFQId).child('weightUnit').set($scope.weightUnit);
                refUser.child('ffq').child(FFQId).child('preFFQComplete').set("yes");
                refUser.child('ffq').child(FFQId).child('preFFQDate').set(currentDateFormatted);
                refUser.child('ffq').child(FFQId).child('preFFQTimestamp').set(new Date().getTime());
                refUser.child('ffq').child(FFQId).child('appName').set(navigator.appName);
                refUser.child('ffq').child(FFQId).child('appCodeName').set(navigator.appCodeName);
                refUser.child('ffq').child(FFQId).child('appVersion').set(navigator.appVersion);
                refUser.child('ffq').child(FFQId).child('userAgent').set(navigator.userAgent);
                refUser.child('ffq').child(FFQId).child('platform').set(navigator.platform);
                refUser.child('ffq').child(FFQId).child('product').set(navigator.product);
                refUser.child('ffq').child(FFQId).child('language').set(navigator.language);
                refUser.child('ffq').child(FFQId).child('vendor').set(navigator.vendor);
                refUser.child('ffq').child(FFQId).child('mostLikelyBrowser').set($scope.mostLikelyBrowser);
                refUser.child('ffq').child(FFQId).child('screenWidth').set(screen.width);
                refUser.child('ffq').child(FFQId).child('screenAvailWidth').set(screen.availWidth);
                refUser.child('ffq').child(FFQId).child('screenHeight').set(screen.height);
                refUser.child('ffq').child(FFQId).child('screenAvailHeight').set(screen.availHeight);

                $scope.showWeight = false;
                $scope.showBaeckeBottomLeft = false;
                $scope.showFFQInstructions = true;
                $scope.showFFQ = true;
                $scope.showBottomRight = false;

            };

            $scope.saveWeight = function(FFQId){

                if ($scope.weightUnit=='stones'){
                    $scope.currentWeight = $scope.currentWeightStones*6.35029+$scope.currentWeightPounds*6.35029/14;
                }
                if ($scope.currentWeight >= 40 && $scope.currentWeight <= 200){
                $scope.showWeight = false;
                $scope.showBaeckeBottomLeft = false;
                $scope.showBaeckeInstructions = true;
                }
            };

            $scope.currentBaeckeQuestionId = 0;

            $scope.startBaecke = function () {
                $scope.showBaecke = true;
                $scope.showBaeckeInstructions = false;
                $scope.showBaeckeQuestions = true;
                $scope.showBaeckeQuestion1 = true;
            };

            $scope.startFFQ = function () {
                $scope.showFFQInstructions = false;
                $scope.showBottomRight = true;
            };

            var baeckeWork = [];
            var baeckeSports = [];
            var baeckeLeisure = [];
            var baeckeSports9a = [];
            var baeckeSports9b = [];

            $scope.saveBaecke = function (answerSelectedID, currentQuestionID, FFQId, factor) {

                var factor = factor;
                // Excluding 9a - 9b
                if (currentQuestionID == 0 || currentQuestionID == 1 || currentQuestionID == 2 || currentQuestionID == 3 || currentQuestionID == 4 || currentQuestionID == 5 || currentQuestionID == 6 || currentQuestionID == 7 || currentQuestionID == 8 || currentQuestionID == 9 || currentQuestionID == 10 || currentQuestionID == 11 || currentQuestionID == 12 || currentQuestionID == 13 || currentQuestionID == 14 || currentQuestionID == 15 || currentQuestionID == 16 || currentQuestionID == 17){
                    // Adjusting the array which started with 0
                    currentQuestionID = currentQuestionID+1;
                    $scope.currentBaeckeQuestionId = currentQuestionID;
                    $scope.answerSelected = null;
                    $scope.showBaeckeBottomLeft = true;
                }
                // Work Index
                if (currentQuestionID == 1){

                    $scope.showBaeckeQuestion1 = false;
                    $scope.showBaeckeQuestions2to4 = true;
                    if (answerSelectedID == 1){
                        baeckeWork[currentQuestionID] = 1;
                    } else{
                        if (answerSelectedID == 2){
                            baeckeWork[currentQuestionID] = 3;
                        } else{
                            baeckeWork[currentQuestionID] = 5;
                        }
                    }
                }
                if (currentQuestionID == 3 || currentQuestionID == 4 ||currentQuestionID == 5){
                    baeckeWork[currentQuestionID] =  answerSelectedID;
                }
                if (currentQuestionID == 2 || currentQuestionID == 6 || currentQuestionID == 7 || currentQuestionID == 8){
                    baeckeWork[currentQuestionID] = 6 - answerSelectedID;
                }
                if (currentQuestionID == 4){
                    $scope.showBaeckeQuestions2to4 = false;
                    $scope.showBaeckeQuestion5 = true;
                }
                if (currentQuestionID == 5){
                    $scope.showBaeckeQuestion5 = false;
                    $scope.showBaeckeQuestions6to7 = true;
                }
                if (currentQuestionID == 7){
                    $scope.showBaeckeQuestions6to7 = false;
                    $scope.showBaeckeQuestion8 = true;
                }
                if (currentQuestionID == 8){

                    $scope.sumBaeckeWork = 0;
                    for (var i=1; i<9; i++){
                        $scope.sumBaeckeWork = $scope.sumBaeckeWork + baeckeWork[i];
                    }
                    refFfq.child(FFQId).child('baecke').child('work').set($scope.sumBaeckeWork/8);
                    $scope.showBaeckeQuestion8 = false;
                    $scope.showBaeckeQuestion9 = true;
                    $scope.showBaeckeQuestion9a = true;
                }
                // Sports Index
                if (currentQuestionID == 9){
                    $scope.multBaeckeSports9a = 0;
                    $scope.multBaeckeSports9b = 0;
                    if (answerSelectedID == 1){
                        baeckeSports[currentQuestionID] = 0;
                        $scope.showBaeckeQuestion9 = false;
                        $scope.showBaeckeQuestion10 = true;
                    } else{
                        $scope.showBaeckeQuestions = false;
                        $scope.showBaeckeQuestion9a = false;
                        $scope.showBaeckeQuestion9a1 = true;
                    }
                }
                if (currentQuestionID == '9a1'){
                    $scope.showBaeckeQuestion9a =  false;
                    $scope.showBaeckeQuestion9a1 =  false;
                    $scope.showBaeckeQuestion9a2 =  true;
                    baeckeSports9a[1] = factor;
                }
                if (currentQuestionID == '9a2'){
                    $scope.showBaeckeQuestion9a2 =  false;
                    $scope.showBaeckeQuestion9a3 =  true;
                    baeckeSports9a[2] = factor;
                }
                if (currentQuestionID == '9a3'){
                    $scope.showBaeckeQuestion9a3 =  false;
                    $scope.showBaeckeQuestion9b =  true;
                    baeckeSports9a[3] = factor;
                    $scope.multBaeckeSports9a = baeckeSports9a[1]*baeckeSports9a[2]*baeckeSports9a[3];
                }
                if (currentQuestionID == '9b'){
                    if (answerSelectedID == 1){

                        if ($scope.multBaeckeSports9a  < 4){
                            baeckeSports[9] = 2;
                        } else{
                            if ($scope.multBaeckeSports9a < 8){
                                baeckeSports[9] = 3;
                            } else{
                                if ($scope.multBaeckeSports9a < 12){
                                    baeckeSports[9] = 4;
                                } else{
                                    baeckeSports[9] = 5;
                                }
                            }
                        }
                        $scope.showBaeckeQuestion9b =  false;
                        $scope.showBaeckeQuestion10 =  true;
                        $scope.showBaeckeQuestions = true;
                    } else{
                        $scope.showBaeckeQuestion9b =  false;
                        $scope.showBaeckeQuestion9b1 =  true;
                    }
                }
                if (currentQuestionID == '9b1'){
                    $scope.showBaeckeQuestion9b1 =  false;
                    $scope.showBaeckeQuestion9b2 =  true;
                    baeckeSports9b[1] = factor;
                }
                if (currentQuestionID == '9b2'){
                    $scope.showBaeckeQuestion9b2 =  false;
                    $scope.showBaeckeQuestion9b3 =  true;
                    baeckeSports9b[2] = factor;
                }
                if (currentQuestionID == '9b3'){
                    $scope.showBaeckeQuestion9b3 =  false;
                    $scope.showBaeckeQuestions = true;
                    $scope.showBaeckeQuestion10 =  true;
                    baeckeSports9b[3] = factor;
                    $scope.multBaeckeSports9b = baeckeSports9b[1]*baeckeSports9b[2]*baeckeSports9b[3];
                    if ($scope.multBaeckeSports9a + $scope.multBaeckeSports9b  < 4){
                        baeckeSports[9] = 2;
                    } else{
                        if ($scope.multBaeckeSports9a + $scope.multBaeckeSports9b < 8){
                            baeckeSports[9] = 3;
                        } else{
                            if ($scope.multBaeckeSports9a + $scope.multBaeckeSports9b < 12){
                                baeckeSports[9] = 4;
                            } else{
                                baeckeSports[9] = 5;
                            }
                        }
                    }
                }
                if (currentQuestionID == 10){
                    $scope.showBaeckeQuestion10 = false;
                    $scope.showBaeckeQuestion11 = true;
                }
                if (currentQuestionID == 11){
                    $scope.showBaeckeQuestion11 = false;
                    $scope.showBaeckeQuestions12to15 = true;
                }
                if (currentQuestionID == 10 || currentQuestionID == 11){
                    baeckeSports[currentQuestionID] = 6 - answerSelectedID;
                }
                if (currentQuestionID == 12){
                    baeckeSports[currentQuestionID] = answerSelectedID;
                    $scope.sumBaeckeSports = 0;
                    for (var i=9; i<13; i++){
                        $scope.sumBaeckeSports = $scope.sumBaeckeSports + baeckeSports[i];
                    }
                    refFfq.child(FFQId).child('baecke').child('sports').set($scope.sumBaeckeSports/4);
                }
                // Leisure Index
                if (currentQuestionID == 13){
                    baeckeLeisure[currentQuestionID] = 6 - answerSelectedID;
                }
                if (currentQuestionID == 14 || currentQuestionID == 15 ||currentQuestionID == 16){
                    baeckeLeisure[currentQuestionID] = answerSelectedID;
                }
                if (currentQuestionID == 15){
                    $scope.showBaeckeQuestions12to15 = false;
                    $scope.showBaeckeQuestion16 = true;
                }
                if (currentQuestionID == 16){
                    $scope.sumBaeckeLeisure = 0;
                    for (var i=13; i<17; i++){
                        $scope.sumBaeckeLeisure = $scope.sumBaeckeLeisure + baeckeLeisure[i];
                    }
                    refFfq.child(FFQId).child('baecke').child('leisure').set($scope.sumBaeckeLeisure/4);
                    refFfq.child(FFQId).child('baecke').child('overall').set($scope.sumBaeckeLeisure/4+$scope.sumBaeckeSports/4+$scope.sumBaeckeWork/8);
                    savePreFFQ(FFQId);
                    $scope.showPreFFQ = false;
                    $scope.showFFQ = true;
                    $scope.showBottomLeft = false;
                }

                refFfq.child(FFQId).child('baecke').child(currentQuestionID).child('answer').set(answerSelectedID);
            };

            $scope.previousBaeckeQuestion = function (currentQuestionID) {

                $scope.currentBaeckeQuestionId = currentQuestionID-1;
                $scope.answerSelected = null;

                if (currentQuestionID == 1){
                    $scope.showBaeckeBottomLeft = false;
                    $scope.showBaeckeQuestion1 = true;
                    $scope.showBaeckeQuestions2to4 = false;
                }
                if (currentQuestionID == 4){
                    $scope.showBaeckeQuestions2to4 = true;
                    $scope.showBaeckeQuestion5 = false;
                }
                if (currentQuestionID == 5){
                    $scope.showBaeckeQuestion5 = true;
                    $scope.showBaeckeQuestions6to7 = false;
                }
                if (currentQuestionID == 7){
                    $scope.showBaeckeQuestions6to7 = true;
                    $scope.showBaeckeQuestion8 = false;
                }
                if (currentQuestionID == 8){
                    $scope.showBaeckeQuestion8 = true;
                    $scope.showBaeckeQuestion9 = false;
                }
                if (currentQuestionID == 9){
                    $scope.showBaeckeQuestions = true;
                    $scope.showBaeckeQuestion9 = true;
                    $scope.showBaeckeQuestion9a = true;
                    $scope.showBaeckeQuestion9a1 = false;
                    $scope.showBaeckeQuestion9a2 = false;
                    $scope.showBaeckeQuestion9a3 = false;
                    $scope.showBaeckeQuestion9b = false;
                    $scope.showBaeckeQuestion9b1 = false;
                    $scope.showBaeckeQuestion9b2 = false;
                    $scope.showBaeckeQuestion9b3 = false;
                    $scope.showBaeckeQuestion10 = false;
                }
                if (currentQuestionID == 10){
                    $scope.showBaeckeQuestion10 = true;
                    $scope.showBaeckeQuestion11 = false;
                }
                if (currentQuestionID == 11){
                    $scope.showBaeckeQuestion11 = true;
                    $scope.showBaeckeQuestions12to15 = false;
                }
                if (currentQuestionID == 15){
                    $scope.showBaeckeQuestions12to15 = true;
                    $scope.showBaeckeQuestion16 = false;
                }
            };

            $scope.startSurvey = function () {
                $scope.showSurveyInstructions = false;
                $scope.showSurveyQuestions = true;
                $scope.showFirstQuestions = true;

            };

            $scope.saveSurvey = function (answerSelectedID, currentQuestionID) {
                // Adjusting the array which started with 0
                currentQuestionID = currentQuestionID+1;
                $scope.currentQuestionId = currentQuestionID;
                $scope.answerSelected = null;
                $scope.showBottomLeft = true;
                SUSComponents[currentQuestionID]= answerSelectedID;

                if (currentQuestionID == 10){
                    $scope.showFirstQuestions = false;
                    $scope.showOverallQuestion = true;
                }
                if (currentQuestionID == 11){
                    $scope.showOverallQuestion = false;
                    $scope.showDifficultiesQuestion = true;
                }
                if (currentQuestionID == 12){
                    $scope.showSurvey = false;
                    var surveySUS = 0;
                    for (var i=1; i<11; i++){
                        if (i % 2){
                            surveySUS  = (surveySUS + SUSComponents[i] - 1);
                        } else{
                            surveySUS = (surveySUS + 5 - SUSComponents[i]);
                        }
                    }
                    surveySUS = surveySUS * 2.5;
                    refUser.child('state').child('surveyComplete').set("true");
                    refUser.child('state').child('surveySUS').set(surveySUS);
                    refSurvey.child('surveySUS').set(surveySUS);
                    // If difficulties were reported
                    if(answerSelectedID == 2){
                        $scope.savePrompt(13, 'answer');
                    } else{
                        refSurvey.child(13).child('answer').set(1);
                    }
                    $scope.ffqMessage = 'MESSAGE_SURVEY_COMPLETED';
                    $scope.showMessage = true;
                }

                refSurvey.child(currentQuestionID).child('answer').set(answerSelectedID);
                refSurvey.child('userid').set(user.uid);
                refSurvey.child('reportDate').set(currentDateFormattedDDMMYYYY);
            };

            $scope.previousSurveyQuestion = function (currentQuestionID) {
                $scope.currentQuestionId = currentQuestionID-1;
                $scope.answerSelected = null;

                if (currentQuestionID == 1){
                    $scope.showBottomLeft = false;
                }

            };



            $scope.startFeedback = function () {
                $scope.showFeedbackInstructions = false;
                $scope.showFeedbackQuestions = true;
                $scope.showFirstFeedbackQuestions = true;

            };

            $scope.saveFeedback = function (answerSelectedID, currentFeedbackID) {
                // Adjusting the array which started with 0
                currentFeedbackID = currentFeedbackID+1;
                $scope.currentFeedbackId = currentFeedbackID;
                $scope.answerSelected = null;
                $scope.showBottomLeft = true;

                if (currentFeedbackID == 6){
                    $scope.showFirstFeedbackQuestions = false;
                    $scope.showFinalFeedbackQuestions = true;
                }

                if (currentFeedbackID == 7 || currentFeedbackID == 8 || currentFeedbackID == 9 ){
                    if(answerSelectedID == 2){
                        $scope.savePromptFeedback(currentFeedbackID, 'answer');
                    } else{
                        refFeedback.child(currentFeedbackID).child('answer').set(1);
                    }
                }

                if (currentFeedbackID == 9){
                    $scope.showFeedback = false;
                    $scope.showFinalFeedbackQuestions = false;
                    $scope.ffqMessage = 'MESSAGE_FEEDBACK_COMPLETED';
                    $scope.showMessage = true;
                    refUser.child('state').child('feedbackComplete').set("yes");
                }

                refFeedback.child(currentFeedbackID).child('answer').set(answerSelectedID);
                refFeedback.child('userid').set(user.uid);
                refFeedback.child('reportDate').set(currentDateFormattedDDMMYYYY);
            };

            $scope.previousFeedbackQuestion = function (currentFeedbackID) {
                $scope.currentFeedbackId = currentFeedbackID-1;
                $scope.answerSelected = null;

                if (currentFeedbackID == 1){
                    $scope.showBottomLeft = false;
                }

                if (currentFeedbackID == 6){
                    $scope.showFirstFeedbackQuestions = true;
                    $scope.showFinalFeedbackQuestions = false;
                }

            };

            $scope.showSimpleToast = function(message) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(message)
                        .position("bottom right")
                        .hideDelay(1000)
                );
            };

            $scope.savePrompt = function(ref1, ref2) {
                this.ref1 = ref1;
                this.ref2 = ref2;
                var confirm = $mdDialog.prompt()
                    .title('Please describe')
                    .placeholder('Enter text there')
                    .ok('OK')
                $mdDialog.show(confirm).then(function(answer) {
                    refSurvey.child(ref1).child(ref2).set(answer);
                    $scope.status = answer;
                });
            };

            $scope.savePromptFeedback = function(ref1, ref2) {
                this.ref1 = ref1;
                this.ref2 = ref2;
                var confirm = $mdDialog.prompt()
                    .title('Please describe')
                    .placeholder('Enter text there')
                    .ok('OK')
                $mdDialog.show(confirm).then(function(answer) {
                    refFeedback.child(ref1).child(ref2).set(answer);
                    $scope.status = answer;
                });
            };

            $scope.savePromptScreening = function(ref1, value) {
                this.ref1 = ref1;
                this.value = value;
                if (value == true){
                    var confirm = $mdDialog.prompt()
                        .title('Please describe')
                        .placeholder('Enter text there')
                        .ok('OK')
                    $mdDialog.show(confirm).then(function(answer) {
                        refUser.child('screening').child(ref1).set(answer);
                    });
                } else {
                    refUser.child('screening').child(ref1).set("");
                }

            };

        }
    ]);


    app.factory('foodsList', ['fbutil', '$firebaseArray', function(fbutil, $firebaseArray) {
        var ref = fbutil.ref('config','foods');
        return $firebaseArray(ref);
    }]);

    app.factory('nutrientsList', ['fbutil', '$firebaseObject', function(fbutil, $firebaseObject) {
        var ref = fbutil.ref('config','nutrients');
        return $firebaseObject(ref);
    }]);


    app.config(['$routeProvider', function($routeProvider) {
// require user to be authenticated before they can access this page
// this is handled by the .whenAuthenticated method declared in
// components/router/router.js
        $routeProvider.whenAuthenticated('/questionnaire', {
            templateUrl: 'ffq/ffq.html',
            controller: 'FfqCtrl'
        })
    }]);

    app.run(['$rootScope', 'Auth', 'fbutil', function($rootScope, Auth, fbutil) {

            // Checking user authorization
            Auth.$onAuth(function(user) {
                if (user != null){
                var refProfiles = fbutil.ref('profiles', 'researchers', user.uid);
                refProfiles.on("value", function (snapshot) {
                    $rootScope.showResearch = snapshot.val();
                });
                var refUserState = fbutil.ref('users', user.uid,'state');
                refUserState.on("value", function (snapshot) {
                     if (snapshot.child('FFQCompleteCount').val() > 0){
                         $rootScope.showReport = true;
                     }
                });

                var refUserGroup = fbutil.ref('users', user.uid,'group');
                    refUserGroup.on("value", function (snapshot) {
                        $rootScope.userGroup = snapshot.val();
                });
                }
            });
    }]);

})(angular);


