(function (angular) {
    "use strict";

    var app = angular.module('myApp.menus',['ngRoute','ngCookies','firebase', 'firebase.utils', 'firebase.auth', 'ngRoute','pascalprecht.translate','nvd3', 'angulartics', 'angulartics.google.analytics']);

    app.controller('MenuController', ['$scope','$location', '$cookies', 'Auth','$mdSidenav', '$translate','$mdDialog', 'hesList','$q',
        function MenuController($scope, $location, $cookies, Auth, $mdSidenav, $translate, $mdDialog, hesList) {

            var locationSearch = $location.search();
            if (locationSearch){
                $cookies.put('utm_source', locationSearch.utm_source);
                $cookies.put('utm_medium', locationSearch.utm_medium);
                $cookies.put('utm_campaign', locationSearch.utm_campaign);
                $cookies.put('utm_term', locationSearch.utm_term);
                $cookies.put('utm_content', locationSearch.utm_content);
            }

            // expose logout function to scope
            $scope.logout = function() {
                Auth.$unauth();
                $location.path('/login');
            };

            var self = this;

            self.hesList =  hesList;

            self.selected     = null;
            self.menus        = [ ];
            self.languageKey = 0;
            self.languages = ["en_UK", "ar_KW"];

            self.education = {
                "en_UK":[
                    {id: "01", label: "Less than secondary school"}, {id: "02", label: "Secondary school graduate"}, {id: "03", label: "Vocational training/College"},
                    {id: "04", label: "Undergraduate degree"}, {id: "05", label: "Postgraduate degree"}
                ],
                "ar_KW":[
                    {id: "01", label: "Less than secondary school"}, {id: "02", label: "Secondary school graduate"}, {id: "03", label: "Vocational training/College"},
                    {id: "04", label: "Bachelor degree"}, {id: "05", label: "Post graduate"}
                ]
            };

            self.recruitment = {
                "en_UK":[
                    {id: "01", label: "e-mail"}, {id: "02", label: "Facebook"}, {id: "03", label: "Instagram"},
                    {id: "04", label: "Twitter"},{id: "05", label: "Word-of-mouth"}, {id: "06", label: "Other"}
                ],
                "ar_KW":[
                    {id: "01", label: "e-mail"}, {id: "02", label: "Facebook"}, {id: "03", label: "Instagram"},
                    {id: "04", label: "Twitter"},{id: "05", label: "Word-of-mouth"}, {id: "06", label: "Other"}
                ]
            };


            self.months = {
                "en_UK":[
                    {id: "01", label: "January"}, {id: "02", label: "February"}, {id: "03", label: "March"},
                    {id: "04", label: "April"}, {id: "05", label: "May"}, {id: "06", label: "June"},
                    {id: "07", label: "July"}, {id: "08", label: "August"}, {id: "09", label: "September"},
                    {id: "10", label: "October"}, {id: "11", label: "November"}, {id: "12", label: "December"}
                ],
                "ar_KW":[
                    {id: "01", label: " يناير،"}, {id: "02", label: " فبراير"}, {id: "03", label: "  مارس"},
                    {id: "04", label: "  ايبريل"}, {id: "05", label: " مايو"}, {id: "06", label: "يونيو"},
                    {id: "07", label: " يوليو،"}, {id: "08", label: " أغسطس "}, {id: "09", label: " سبتمبر"},
                    {id: "10", label: "  أكتوبر"}, {id: "11", label: " نوفمبر"}, {id: "12", label: " ديسيمبر"}
                ]
            };

            self.frequencies=[
                {en_UK:"Not in the last month", ar_KW:" أبدا", freqDay:0},
                {en_UK:"1 per day",ar_KW:" 1/ اليوم ",freqDay:1},
                {en_UK:"1-3 in the last month",ar_KW:" 1-3 في الشهر ",freqDay:0.0667},
                {en_UK:"2-3 per day",ar_KW:"2-3/ اليوم",freqDay:2.5},
                {en_UK:"1 per week",ar_KW:" مره في الاسبوع ",freqDay:0.1429},
                {en_UK:"4-6 per day",ar_KW:" 4-6/ اليوم",freqDay:5},
                {en_UK:"2-4 per week",ar_KW:" 2-4 / الأسبوع",freqDay:0.4286},
                {en_UK:"7+ per day",ar_KW:" >6/ اليوم",freqDay:6},
                {en_UK:"5-6 per week",ar_KW:"5-6 / الأسبوع",freqDay:0.7857}
            ];

            self.frequenciesLine1=[
                {en_UK:"Not in the last month", ar_KW:" أبدا", freqDay:0},
                {en_UK:"1-3 in the last month",ar_KW:" 1-3 في الشهر ",freqDay:0.0667}
            ];

            self.frequenciesLine2=[
                {en_UK:"1 per week",ar_KW:" مره في الاسبوع ",freqDay:0.1429},
                {en_UK:"2-4 per week",ar_KW:" 2-4 / الأسبوع",freqDay:0.4286},
                {en_UK:"5-6 per week",ar_KW:"5-6 / الأسبوع",freqDay:0.7857}
            ];

            self.frequenciesLine3=[
                {en_UK:"1 per day",ar_KW:" 1/ اليوم ",freqDay:1},
                {en_UK:"2-3 per day",ar_KW:"2-3/ اليوم",freqDay:2.5},
                {en_UK:"4-6 per day",ar_KW:" 4-6/ اليوم",freqDay:5},
                {en_UK:"7+ per day",ar_KW:" >6/ اليوم",freqDay:6}
            ];

            self.occupPA = {
                "en_UK":[
                    {value: "Light", label: "Professional and technical workers, Administrative and Management, Sales representative, Clinical and related workers, Housewives, Unemployed"},
                    {value: "Moderate", label: "Sales workers, Service workers, Students, Field work that requires constant movement"},
                    {value: "Heavy", label: "Equipment operators, labourers (work that requires carrying of heavy machinery or bricks)"}
                ],
                "ar_KW":[
                    {value: "Light", label:"  أعمال مهنية وفنية، أعمال إدارية، مندوب مبيعات، أعمال طبية، ربة منزل، متقاعد.  "},
                    {value: "Moderate", label: "العمل في المبيعات، أعمال حره، طالب، عمل ميداني الذي يتطلب الكثير من المجهود"},
                    {value: "Heavy", label: "مشغل المعدات والعمال ( العمل الذي يتطلب تحمل من الآلات الثقيلة أو الطوب"}
                ]
            };

            self.nonOccupPA = {
                "en_UK":[
                    {value: "Non-Active", label: "Daily routine involves light walking, cycling, light exercise"},
                    {value: "Moderate", label: "Undertake intense exercise lasting 20-45 minutes at least twice a week"},
                    {value: "Very", label: "Undertake intense exercise lasting at least an hour per day"}
                ],
                "ar_KW":[
                    {value: "Non-Active", label: " رياضه خفيفه يومية مثل المشي ، ركوب العجله. "},
                    {value: "Moderate", label:" ممارسة الرياضة لمدة 20-45 دقيقة على الأقل مرتين في الاسبوع  "},
                    {value: "Very", label: " ممارسة الرياضة لمدة لا تقل عن الساعه  في اليوم ، ممارسة الرياضة اليومية."}
                ]
            };

            self.surveyAnswers = {
                "en_UK":[
                    {id:1, value: "Strongly disagree"}, {id:2, value: "Disagree"}, { id:3,value: "Neutral"},
                    {id:4, value: "Agree"}, {id:5, value: "Strongly agree"}
                ],
                "ar_KW":[
                    {id:1, value: "أعارض بشدة "}, {id:2, value: " اعارض "}, {id:3, value: " محايد"},
                    {id:4, value: "أوافق"}, {id:5, value: "أوافق بشدة "}
                ]
            };

            self.surveyOverallAnswers = {
                "en_UK":[
                    {id:1, value: "Best imaginable"}, {id:2, value: "Excellent"}, {id:3, value: "Good"},
                    {id:4, value: "Fair"}, {id:5, value: "Poor"}, {id:6, value: "Awful"},
                    {id:7, value: "Worst imaginable"}
                ],
                "ar_KW":[
                    {id:1, value: " ممتازة "}, {id:2, value: " جيدة جداً"}, {id:3, value: "جيدة"},
                    {id:4, value: " عادية"}, {id:5, value: " سيئة"}, {id:6, value: " سيئ جدا"},
                    {id:7, value: " أسوأ مما كنت أتخيل بكثير "}
                ]
            };

            self.surveyDifficultiesAnswers = {
                "en_UK":[
                    {id:1, value: "No"}, {id:2, value: "Yes"}
                ],
                "ar_KW":[
                    {id:1, value: " لا "}, {id:2, value: " نعم "}
                ]
            };

            self.surveyQuestions = {
                "en_UK":[
                    {value: "I think that I would like to use this system frequently"},
                    {value: "I found the system unnecessarily complex"},
                    {value: "I thought the system was easy to use"},
                    {value: "I think that I would need the support of a technical person to be able to use this system"},
                    {value: "I found the various functions in this system were well integrated"},
                    {value: "I thought there was too much inconsistency in this system"},
                    {value: "I would imagine that most people would learn to use this system very quickly"},
                    {value: "I found the system very awkward to use"},
                    {value: "I felt very confident using the system"},
                    {value: "I needed to learn a lot of things before I could get going with this system"},
                    {value: "Overall, I would rate the user-friendliness of this system as:"},
                    {value: "Have you had any difficulties with using the system?"}
                ],
                "ar_KW":[
                    {value: " أود استخدام هذا النظام في كثير من الأحيان"},
                    {value: " النظام كان صعب الاستخدام"},
                    {value: "  النظام كان سهل الاستخدام"},
                    {value: " أحتاج الى مساعدة تقنية لكي استخدم النظام"},
                    {value: "  وجدت سهوله باستخدام النظام"},
                    {value: " وجدت عدم انتظام في الاسلئه"},
                    {value: " اتوقع انه هذا البرنامج سهل الاستخدام عند معظم الافراد"},
                    {value: " وجدت أن النظام معقد"},
                    {value: " شعرت بالثقه عند استخدامي للبرنامج"},
                    {value: " كنت بحاجة لتعلم الكثير من الأشياء قبل أن أتمكن من استخدام النظام"},
                    {value: "  بشكل عام, كانت سلاسة هذا النظام"},
                    {value: "   هل وجدت صعوبه في بعض أجزاء النظام؟"}
                ]
            };

            self.baeckeQuestions = {
                "en_UK":[
                    {value: "What is your occupational activity type?"},
                    {value: "At work I sit"},
                    {value: "At work I stand"},
                    {value: "At work I walk"},
                    {value: "At work I lift heavy loads"},
                    {value: "After working I am tired"},
                    {value: "At work I sweat"},
                    {value: "In comparison with others of my own age my work is physically"},
                    {value: "Do you play sport?"},
                    {value: "In comparison with others of my own age I think my physical activity at leisure time is "},
                    {value: "During leisure time I sweat"},
                    {value: "During leisure time I play sport"},
                    {value: "During leisure time I watch television"},
                    {value: "During leisure time I walk"},
                    {value: "During leisure time I cycle"},
                    {value: "How many minutes do you walk and/or cycle per day to and from work, school and shopping"}
                ],
                "ar_KW":[
                    {value: "What is your occupational activity type?"},
                    {value: "At work I sit"},
                    {value: "At work I stand"},
                    {value: "At work I walk"},
                    {value: "At work I lift heavy loads"},
                    {value: "After working I am tired"},
                    {value: "At work I sweat"},
                    {value: "In comparison with others of my own age my work is physically"},
                    {value: "Do you play sport?"},
                    {value: "In comparison with others of my own age I think my physical activity at leisure time is "},
                    {value: "During leisure time I sweat"},
                    {value: "During leisure time I play sport"},
                    {value: "During leisure time I watch Television"},
                    {value: "During leisure time I walk"},
                    {value: "During leisure time I cycle"},
                    {value: "How many minutes do you walk and/or cycle per day to and from work, school and shopping"}

                ]
            };

            self.baeckeQuestions9ab = {
                "en_UK":[
                    {value: "Which type of sport do you play most frequently?"},
                    {value: "How many hours a week?"},
                    {value: "How many months a year?"},
                    {value: "Do you play a second sport?"},
                    {value: "Which type of sport is it?"},
                    {value: "How many hours a week?"},
                    {value: "How many months a year?"}
                ],
                "ar_KW":[
                    {value: "Which type of sport do you play most frequently?"},
                    {value: "How many hours a week?"},
                    {value: "How many months a year?"},
                    {value: "Do you play a second sport?"},
                    {value: "Which type of sport is it?"},
                    {value: "How many hours a week?"},
                    {value: "How many months a year?"}
                ]
            };


            self.baeckeAnswers1 = {
                "en_UK":[
                    {id:1, value: "Low",  description: "Driving, Shopkeeping, Studying, etc."}, {id:2, value: "Medium",  description: "Factory, plumbing, carpentry, etc"}, { id:3,value: "High",  description: "Construction, sports, etc."}
                ],
                "ar_KW":[
                    {id:1, value: "Low",  description: "Driving, Shopkeeping, Studying, etc."}, {id:2, value: "Medium",  description: "Factory, plumbing, carpentry, etc"}, { id:3,value: "High",  description: "Construction, sports, etc."}
                ]
            };

            self.baeckeAnswers2to4 = {
                "en_UK":[
                    {id:1, value: "Never"}, {id:2, value: "Seldom"}, { id:3,value: "Sometimes"},
                    {id:4, value: "Often"}, {id:5, value: "Always"}
                ],
                "ar_KW":[
                    {id:1, value: "Never"}, {id:2, value: "Seldom"}, { id:3,value: "Sometimes"},
                    {id:4, value: "Often"}, {id:5, value: "Always"}
                ]
            };

            self.baeckeAnswers5and12to15 = {
                "en_UK":[
                    {id:1, value: "Never"}, {id:2, value: "Seldom"}, { id:3,value: "Sometimes"},
                    {id:4, value: "Often"}, {id:5, value: "Very often"}
                ],
                "ar_KW":[
                    {id:1, value: "Never"}, {id:2, value: "Seldom"}, { id:3,value: "Sometimes"},
                    {id:4, value: "Often"}, {id:5, value: "Very often"}
                ]
            };

            self.baeckeAnswers6to7and11 = {
                "en_UK":[
                    {id:1, value: "Very Often"}, {id:2, value: "Often"}, { id:3,value: "Sometimes"},
                    {id:4, value: "Seldom"}, {id:5, value: "Never"}
                ],
                "ar_KW":[
                    {id:1, value: "Very Often"}, {id:2, value: "Often"}, { id:3,value: "Sometimes"},
                    {id:4, value: "Seldom"}, {id:5, value: "Never"}
                ]
            };

            self.baeckeAnswers8 = {
                "en_UK":[
                    {id:1, value: "Much Heavier"}, {id:2, value: "Heavier"}, { id:3,value: "As Heavy"},
                    {id:4, value: "Lighter"}, {id:5, value: "Much Lighter"}
                ],
                "ar_KW":[
                    {id:1, value: "Much Heavier"}, {id:2, value: "Heavier"}, { id:3,value: "As Heavy"},
                    {id:4, value: "Lighter"}, {id:5, value: "Much Lighter"}
                ]
            };

            self.baeckeAnswers9ab = {
                "en_UK":[
                    {id:1, value: "No"}, {id:2, value: "Yes"}
                ],
                "ar_KW":[
                    {id:1, value: "No"}, {id:2, value: "Yes"}
                ]
            };

            self.baeckeAnswers9a1 = {
                "en_UK":[
                    {id:1, value: "Low",  description: "Gentle walking, golf, bowling, yoga, snooker etc.", factor:0.76}, {id:2, value: "Medium",  description: "Brisk walking, tennis, cycling, dancing etc.", factor:1.26}, { id:3,value: "High",  description: "Football, rugby, running, martial arts etc.", factor:1.76}
                ],
                "ar_KW":[
                    {id:1, value: "Low",  description: "Gentle walking, golf, bowling, yoga, snooker etc.", factor:0.76}, {id:2, value: "Medium",  description: "Badminton, cycling, dancing, tennis etc.", factor:1.26}, { id:3,value: "High",  description: "Football, rugby, running, martial arts etc.", factor:1.76}
                ]
            };

            self.baeckeAnswers9a2 = {
                "en_UK":[
                    {id:1, value: "<1 hour", factor:0.5}, {id:2, value: "1-2 hours", factor:1.5}, { id:3,value: "2-3 hours", factor:2.5},
                    {id:4, value: "3-4 hours", factor:3.5}, {id:5, value: ">4 hours", factor:4.5}
                ],
                "ar_KW":[
                    {id:1, value: "<1 hour", factor:0.5}, {id:2, value: "1-2 hours", factor:1.5}, { id:3,value: "2-3 hours", factor:2.5},
                    {id:4, value: "3-4 hours", factor:3.5}, {id:5, value: ">4 hours", factor:4.5}
                ]
            };

            self.baeckeAnswers9a3 = {
                "en_UK":[
                    {id:1, value: "<1 month", factor:0.04}, {id:2, value: "1-3 months", factor:0.17}, { id:3,value: "4-6 months", factor:0.42},
                    {id:4, value: "7-9 months", factor:0.67}, {id:5, value: ">9 months", factor:0.92}
                ],
                "ar_KW":[
                    {id:1, value: "<1 month", factor:0.04}, {id:2, value: "1-3 months", factor:0.17}, { id:3,value: "4-6 months", factor:0.42},
                    {id:4, value: "7-9 months", factor:0.67}, {id:5, value: ">9 months", factor:0.92}
                ]
            };

            self.baeckeAnswers10 = {
                "en_UK":[
                    {id:1, value: "Much More"}, {id:2, value: "More"}, { id:3,value: "The same"},
                    {id:4, value: "Less"}, {id:5, value: "Much Less"}
                ],
                "ar_KW":[
                    {id:1, value: "Much More"}, {id:2, value: "More"}, { id:3,value: "The same"},
                    {id:4, value: "Less"}, {id:5, value: "Much Less"}
                ]
            };
            
            self.baeckeAnswers16 = {
                "en_UK":[
                    {id:1, value: "<5 minutes"}, {id:2, value: "5-15 minutes"}, { id:3,value: "15-30 minutes"},
                    {id:4, value: "30-45 minutes"}, {id:5, value: ">45 minutes"}
                ],
                "ar_KW":[
                    {id:1, value: "<5 minutes"}, {id:2, value: "5-15 minutes"}, { id:3,value: "15-30 minutes"},
                    {id:4, value: "30-45 minutes"}, {id:5, value: ">45 minutes"}
                ]
            };

            self.feedbackQuestions = {
                "en_UK":[
                    {value: "I find the feedback report attractive to read"},
                    {value: "Overall, I understood the feedback report"},
                    {value: "After reading the report, I know how to change my diet to make it healthier"},
                    {value: "The report showed useful advice"},
                    {value: "The report reflected my diet intake"},
                    {value: "I found the application useless"},
                    {value: "Was there anything in the report that you found particularly difficult to understand?"},
                    {value: "Do you need additional to help you make changes to your diet at this moment?"},
                    {value: "Do you have any further comments regarding the feedback you received?"}
                ],
                "ar_KW":[
                    {value: "I find the feedback report attractive to read"},
                    {value: "Overall, I understood the feedback report"},
                    {value: "After reading the report, I know how to change my diet to make it healthier"},
                    {value: "The report showed useful advice"},
                    {value: "The report reflected my diet intake"},
                    {value: "I found the application useless"},
                    {value: "Was there anything in the report that you found particularly difficult to understand?"},
                    {value: "Do you need additional to help you make changes to your diet at this moment?"},
                    {value: "Do you have any further comments regarding the feedback you received?"}
                ]
            };

            self.likertAnswers = {
                "en_UK":[
                    {id:1, value: "Strongly Disagree"}, {id:2, value: "Disagree"}, { id:3,value: "Neutral"},
                    {id:4, value: "Agree"}, {id:5, value: "Strongly Agree"}
                ],
                "ar_KW":[
                    {id:1, value: "أعارض بشدة "}, {id:2, value: " اعارض "}, {id:3, value: " محايد"},
                    {id:4, value: "أوافق"}, {id:5, value: "أوافق بشدة "}
                ]
            };

            self.yesNoAnswers = {
                "en_UK":[
                    {id:1, value: "No"}, {id:2, value: "Yes"}
                ],
                "ar_KW":[
                    {id:1, value: "No"}, {id:2, value: "Yes"}
                ]
            };



            self.definitions = {
                "en_UK":[
                    {
                    hes: "Healthy Eating Score",
                    hesDef: "Each result varies from 0 to 100. The overall score is calculated based on these results.",
                    foodsRecommended: "Foods Recommended",
                    foodsRecommendedDef: "Recommended foods. You are encouraged to eat foods of this group. The more the better. 100% represents the recommended consumption.",
                    foodsLimit: "Foods to Limit.",
                    foodsLimitDef: "Foods whose consumption is discouraged. The less the better. 100% represents the limit.",
                    physicalActivity: "Physical Activity",
                    overallScore: "Overall Score",
                    workScore: "Work Score",
                    leisureScore: "Leisure-time (non-sports) Activity",
                    sportsScore: "Sports Score",
                    weight: "Weight"
                    }
                ],
                "ar_KW":[
                    {
                    hes: "(Arabic) Healthy Eating Score",
                    hesDef: "(Arabic) Each result varies from 0 to 100. The overall score is calculated based on these results.",
                    foodsRecommended: " (Arabic) Foods Recommended",
                    foodsRecommendedDef: "(Arabic) You are encouraged to eat foods of this group. The more the better.",
                    foodsLimit: "(Arabic) Foods to Limit",
                    foodsLimitDef: "(Arabic) Foods whose consumption is discouraged",
                    physicalActivity: "(Arabic) Physical Activity",
                    overallScore: "(Arabic) Overall Score",
                    workScore: "(Arabic) Work Score",
                    leisureScore: "(Arabic) Leisure-time (non-sports) Activity",
                    sportsScore: "(Arabic) Sports Score",
                    weight: "(Arabic) Weight"
                    }
                ]
            };


            self.portionSizes = ["small", "medium", "large"];

            self.menus = [
                {
                    url: 'home',
                    name: 'home',
                    icon: 'svg-home',
                    ngshow:'true',
                    nghide:'loggedIn'
                },
                {
                    url: 'questionnaire',
                    name: 'questionnaire',
                    icon: 'svg-study',
                    ngshow:'loggedIn',
                    nghide:'false'
                },
                {
                    url: 'login',
                    name: 'login',
                    icon: 'svg-account',
                    ngshow:'true',
                    nghide:'loggedIn'
                },
                {
                    url: 'reports',
                    name: 'reports',
                    icon: 'svg-barchart',
                    ngshow:'showReport',
                    nghide:'true'
                },
                {
                    url: 'research',
                    name: 'research',
                    icon: 'svg-linechart',
                    ngshow:'showResearch',
                    nghide:'true'
                },
                {
                    url: 'account',
                    name: 'my account',
                    icon: 'svg-account',
                    ngshow:'loggedIn',
                    nghide:'false'
                }
            ];

            self.selectedLanguage = self.languages[self.languageKey];
            self.selectMenu   = selectMenu;
            self.toggleMenu   = toggleMenuList;
            self.setLang   = setLang;
            self.showHelp   = showHelp;
            self.showInfo   = showInfo;

            self.selected = self.menus[0];

            // *********************************
            // Internal methods
            // *********************************

            /**
             * Hide or Show the 'left' sideNav area
             */
            function toggleMenuList() {
                $mdSidenav('left').toggle();
            }

            /**
             * Select the current avatars
             * @param menuId
             */
            function selectMenu ( menuItem ) {
                self.selected = angular.isNumber(menuItem) ? $scope.menus[menuItem] : menuItem;
            }

            function setLang (langKey) {

                if (langKey == self.languages.length-1){
                    langKey = -1;
                }
                $translate.use(self.languages[langKey+1]);
                self.languageKey =langKey+1;
                self.selectedLanguage = self.languages[self.languageKey];

             /*   if (self.selectedLanguage == "en_UK"){
                    self.hesInfo = self.hesList.english;
                } else{
                    self.hesInfo = self.hesList.arabic;
                }*/
            }



            function showHelp (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'menu/helpDialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function(answer) {
                        // $scope.status = answer;
                    }, function() {
                        // $scope.status = 'You cancelled the dialog.';
                    });
            }

            function showInfo (ev) {
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'menu/infoDialog.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                })
                    .then(function(answer) {
                        // $scope.status = answer;
                    }, function() {
                        // $scope.status = 'You cancelled the dialog.';
                    });
            }



            function DialogController($scope, $mdDialog) {
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

        }
    ]);




    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'home/home.html',
            controller: 'HomeCtrl',
            resolve: {
                // forces the page to wait for this promise to resolve before controller is loaded
                // the controller can then inject `user` as a dependency. This could also be done
                // in the controller, but this makes things cleaner (controller doesn't need to worry
                // about auth status or timing of accessing data or displaying elements)
                user: ['Auth', function (Auth) {
                    return Auth.$waitForAuth();
                }]
            }
        });

    }]);

    app.factory('hesList', ['fbutil', '$firebaseObject', function(fbutil, $firebaseObject) {
        var ref = fbutil.ref('config','hesInfo');
        return $firebaseObject(ref);
    }]);

/*
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'home/home.html',
            controller: 'HomeCtrl',
            resolve: {
                // forces the page to wait for this promise to resolve before controller is loaded
                // the controller can then inject `user` as a dependency. This could also be done
                // in the controller, but this makes things cleaner (controller doesn't need to worry
                // about auth status or timing of accessing data or displaying elements)
                user: ['Auth', function (Auth) {
                    return Auth.$waitForAuth();
                }]
            }
        });

    }]);
    */

/*    app.config(['$routeProvider', function($routeProvider) {
// require user to be authenticated before they can access this page
// this is handled by the .whenAuthenticated method declared in
// components/router/router.js
        $routeProvider.whenAuthenticated('/home', {
            templateUrl: 'home/home.html',
            controller: 'HomeCtrl'
        })
    }]);*/

})(angular);


/*
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/', {
                templateUrl: 'home/home.html',
                controller: 'HomeCtrl',
                resolve: {
                    // forces the page to wait for this promise to resolve before controller is loaded
                    // the controller can then inject `user` as a dependency. This could also be done
                    // in the controller, but this makes things cleaner (controller doesn't need to worry
                    // about auth status or timing of accessing data or displaying elements)
                    user: ['Auth', function (Auth) {
                        return Auth.$waitForAuth();
                    }]
                }
            });

        }]);
*/
