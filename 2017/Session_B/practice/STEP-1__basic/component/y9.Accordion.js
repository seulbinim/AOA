/**
 * y9.Accordion
 * @version 0.0.1
 * @author yamoo9 <yamoo9@naver.com>
 * @todo Accordion, AccordionItem 클래스 정의
 */



;(function(global, $, y9){
  'use strict';

  // 컴포넌트 기본 옵션
  var defaults = {
    active_class: 'is-active',
    active_index: null,
    close_all: true,
    radio: false,
    animate: false,
    duration: 300,
    easing: 'swing', // 참고: http://easings.net/ko
  };

  /**
   * y9.Accordion 컴포넌트 생성.
   * @namespace {Object} y9
   * @class y9.Accordion
   * @public
   * @param {String|HTMLElement|jQueryObject} element - 아코디언 컴포넌트로 생성할 대상
   */
  y9.Accordion = function(element, options){
    /**
     * 컴포넌트 옵션(기본 옵션과 사용자 정의 옵션을 합성)
     * @public
     */
    this.options = $.extend(true, {}, y9.Accordion.defaults, options);

    /**
     * 컴포넌트 요소
     * @public
     */
    this.$el = $(element);

    /**
     * 컴포넌트 현재 활성화 인덱스
     * @protected
     */
    this._current = null;

    /**
     * 컴포넌트 이전 활성화 인덱스
     * @protected
     */
    this._pre = null;

    /**
     * 컴포넌트 아이템 콜렉션
     * @private
     */
    this._items = [];

    // jQuery UI Easing 값을 사용한 경우, jquery-easing CDN 파일 로드
    if ( /In|Out/.test(this.options.easing) ) {
      $.getScript('https://unpkg.com/jquery-easing@0.0.1/dist/jquery.easing.1.3.umd.min.js', $.proxy(this, '_init'));
    } else {
      this._init();
    }

  };

  /**
   * y9.Accordion 클래스 프로토타입
   * @protected
   */
  $.extend(y9.Accordion.prototype, {
    /**
     * 컴포넌트 초기화
     * @private
     */
    _init: function(){
      var accordion = this;

      accordion.$el.children().each(function(index, element){
        // 아코디언 아이템 생성 및 수집
        accordion._items.push(new y9.AccordionItem(element, index, accordion));
      });

      // 초기 활성화
      var index = this.options.active_index;
      if ( $.type(index) === 'number' ) {
        this.active(this.options.active_index);
      }
      if ( $.type(index) !== 'number' && !this.options.close_all ) {
        this.active(0);
      }

      this._setup();
      this._bind();
    },

    /**
     * 컴포넌트 셋업
     * @private
     */
    _setup: function(){
      if ( this.options.animate ) {
        this.$el.addClass('is-animate');
      }
    },

    /**
     * 컴포넌트 커스텀 이벤트 수신
     * @private
     */
    _bind: function(){
      this.$el.on('deactive', $.proxy(this, 'deactive'));
    },

    /**
     * 컴포넌트 아이템 반환
     * @public
     * @param {Number} index - 개별 아이템 인덱스
     * @returns {AccordionItem}
     */
    items: function(index){
      var type = $.type(index);
      if ( type !== 'undefined' && type !== 'number' ) { throw '.items(n) 숫자를 전달해야 합니다.' }
      if ( type === 'undefined' ) {
        return this._items;
      } else if (index < 0) {
        return this._items[this._items.length - 1];
      } else {
        return this._items[index];
      }
    },

    /**
     * 컴포넌트 아이템 활성화
     * @public
     * @param {Number} index - 개별 아이템 인덱스
     */
    active: function(index){
      var type = $.type(index);
      if ( type === 'undefined' || (type !== 'undefined' && type !== 'number') ) { throw '.active(n) 숫자를 전달해야 합니다.' }
      this.items(index).expand();
    },

    /**
     * 컴포넌트 아이템 비활성화
     * @public
     */
    deactive: function(){
      var pre = this._pre;
      if ( $.type(pre) !== 'null' ) {
        this.items(pre).collapse();
      }
    },

    /**
     * 컴포넌트 아이템 활성화 개수 1개인지 검증
     * @public
     * @returns {Boolean}
     */
    isPanelOnlyOneOpened: function(){
      var expanded_count = 0;
      $.each(this._items, function(index, item){
        if( item.isExpanded() ) { expanded_count += 1; }
      });
      return expanded_count === 1;
    },

    updatePreCurrent: function(index){
      for ( var item, items=this._items, i=0, l=items.length; i<l; i++ ) {
        item = items[i];
        if ( item.isExpanded() ) {
          this._pre = item._index;
          break;
        }
      }
      this._current = index;
    },

  });

  /**
   * y9.Accordion 클래스 기본 옵션
   * @public
   */
  y9.Accordion.defaults = defaults;



  /// ------------------------------------------------------------------------------



  /**
   * y9.AccordionItem 컴포넌트 생성.
   * @namespace {Object} y9
   * @class y9.AccordionItem
   * @public
   * @param {jQueryObject} element - 아코디언 아이템 컴포넌트로 생성할 대상
   */
  y9.AccordionItem = function(element, index, accordion){
    /**
     * 컴포넌트 요소
     * @public
     */
    this.$item = $(element);

    /**
     * 컴포넌트 요소 인덱스
     * @private
     */
    this._index = index;

    /**
     * 부모 컴포넌트 요소
     * @private
     */
    this._parent = accordion;

    /**
     * 컴포넌트 아이템 속성
     * @public
     */
    this.options = this._parent.options;

    /**
     * 컴포넌트 아이템 헤더
     * @public
     */
    this.$heading = null;

    /**
     * 컴포넌트 아이템 패널
     * @public
     */
    this.$panel = null;

    this._init();
  };

  /**
   * y9.AccordionItem 클래스 프로토타입
   * @protected
   */
  $.extend(y9.AccordionItem.prototype, {

    /**
     * 컴포넌트 초기화
     * @private
     */
    _init: function(){
      var $children = this.$item.children();
      // 아코디언 아이템 헤더
      this.$heading = $children.first();
      // 아코디언 아이템 헤더 버튼
      this.$button  = this.$heading.children('a, button');
      // 아코디언 아이템 패널
      this.$panel   = $children.last();

      this._bind();
    },

    /**
     * 컴포넌트 이벤트 바인딩
     * @private
     */
    _bind: function(){
      // 헤더 버튼 클릭하면 toggle() 메서드 실행
      this.$button.on('click', $.proxy(this, 'toggle'));
    },

    /**
     * 패널 펼침
     * @public
     * @method
     */
    expand: function(){
      var parent = this._parent,
          options = this.options;

      // pre, current 인덱스 업데이트
      parent.updatePreCurrent(this._index);

      // 라디오 기능 활성화일 경우, 부모 컴포넌트에 'deactive' 커스텀 이벤트 알림
      if ( options.radio ) {
        parent.$el.trigger('deactive');
      }

      this.$heading.addClass(this.options.active_class);

      if ( !options.animate ) {
        this.$panel.show();
      } else {
        this.$panel.slideDown(options.duration, options.easing);
      }

    },

    /**
     * 패널 접힘
     * @public
     * @method
     */
    collapse: function(){
      var parent  = this._parent,
          options = this.options;

      if (
        // 라디오 비활성화, 모든 패널 닫음(close_all) 조건이 거짓이고, 패널이 한 개만 열린 상태일 경우, 못 닫게 차단
        !options.radio && !options.close_all && parent.isPanelOnlyOneOpened() ||
        // 라디오 활성화, 모든 패널 닫음 조건이 거짓이고, 현재 활성화 인덱스와 컴포넌트 인덱스가 동일한 경우, 못 닫게 차단
        options.radio && !options.close_all && parent._current === this._index
      ) {
        return;
      }

      this.$heading.removeClass(this.options.active_class);

      if ( !options.animate ) {
        this.$panel.hide();
      } else {
        this.$panel.slideUp(options.duration, options.easing);
      }

    },

    /**
     * 패널 토글
     * @public
     * @method
     */
    toggle: function(e){
      e.preventDefault();

      // 패널 초기 활성화가 안되어 있을 경우만 작동
      if ( $.type(this._parent._current) !== 'number' ) {
        this.expand();
        return; // 종료
      }

      if ( this.isExpanded() ) {
        this.collapse();
      } else {
        this.expand();
      }

    },

    /**
     * 패널 펼침/접힘 상태 반환
     * @public
     * @method
     * @return {Boolean}
     */
    isExpanded: function(){
      return this.$panel.is(':visible');
    },

  });


})(window, window.jQuery, (window.y9 = window.y9 || {}));