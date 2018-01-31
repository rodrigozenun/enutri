(function(){
  'use strict';

  angular.module('myApp.menus')
         .service('menuService', ['$q', menuService]);

  /**
   * Menu DataService
   * Uses embedded, hard-coded data model; acts asynchronously to simulate
   * remote data service call(s).
   *
   * @returns {{loadAll: Function}}
   * @constructor
   */
  function menuService($q){
    var menus = [
      {
        name: 'home',
        avatar: 'svg-home',
        ngshow:'true',
        nghide:'loggedIn'
      },
      {
        name: 'study',
        avatar: 'svg-study',
        ngshow:'loggedIn',
        nghide:'false'
      },
      {
        name: 'login',
        avatar: 'svg-login',
        ngshow:'true',
        nghide:'loggedIn'
      },
      {
        name: 'reports',
        avatar: 'svg-account',
        ngshow:'loggedIn',
        nghide:'false'
      },
      {
        name: 'account',
        avatar: 'svg-account',
        ngshow:'loggedIn',
        nghide:'false'
      }
    ];

    // Promise-based API
    return {
      loadAllMenus : function() {
        // Simulate async nature of real remote calls
        return $q.when(menus);
      }
    };
  }

})();
