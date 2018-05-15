/*
 Tomloprod Modal 1.0.2
 
 The MIT License (MIT)
 
 Copyright (c) 2015 by Tomás López.
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
 
var TomloprodModal = (function () {
	"use strict";

	var defaults = {};
	defaults.closeButton = null;
	defaults.closeOnEsc = true;
	defaults.draggable = true;
	defaults.closeOnOverlay = true;
	defaults.removeOverlay = false;
	defaults.handlers = {};
	defaults.mainContainer = [];
	defaults.showMessages = false;
	defaults.closeTimeout = null;

	var draggingModal = null;
	var draggingPosition = null;
	var modalStack = [];
	
	function TomloprodModal(){
		this.closeButton = defaults.closeButton;
        this.closeOnEsc = defaults.closeOnEsc;
        this.draggable = defaults.draggable;
        this.closeOnOverlay = defaults.closeOnOverlay;
		this.removeOverlay = defaults.removeOverlay;
        this.handlers = defaults.handlers;
		this.mainContainer = defaults.mainContainer;
		this.closeTimeout = defaults.closeTimeout;
	};

    /**
     * Adds the value to the specified property to a set of elements.
     * @param {Objects[]} els
     * @param {String} propiedad
     * @param {String} valor
     */
    function addPropertyValueFromClasses(els, propiedad, valor) {
        [].forEach.call(els, function (el) {
            el.style[propiedad] = valor;
        });
    }
    /**
     * Checks whether the element contains the specified class.
     * @param {Event.target} event
     * @param {String} className
     * @returns {Boolean}
     */
    function hasClass(event, className) {
        if (event.classList) {
            return event.classList.contains(className);
        }
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(event.className);
    }
	/**
     * Find parent with data-tm-modal
     * @param {Event.target} element
     * @returns {Object}
     */
	function findParentWithDataModal(elem) {
		try {
			if(elem.getAttribute('data-tm-modal')){
				return elem;
			}
		} catch(e) {
			return e;
		}
		while(!elem.getAttribute('data-tm-modal')) {
			return findParentWithDataModal(elem.parentNode);
		}
	}
    /**
     * Add a class to the element indicated.
     * @param {Event.target} event
     * @param {String} className
     */
    function addClass(event, className) {
        if (event.classList) {
            event.classList.add(className);
        } else {
            event.className += ' ' + className;
        }
    }

    /**
     * Return the position of the element indicated into array.
     * @param {Array} array
     * @param {String} item
     * @returns {Number}
     */
    function indexOf(array, item) {
        var conta = 0, len = array.length;
        for (conta = 0; conta < len; conta += 1) {
            if (array[conta].toString() === item.toString()) {
                return conta;
            }
        }
        return -1;
    }
    /**
     * Deletes the class indicated on the item indicated.
     * @param {event.target} event
     * @param {String} className
     */
    function removeClass(event, className) {
        if (event.classList) {
            event.classList.remove(className);
        } else {
			if(typeof event.className !== "undefined"){
				event.className = event.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
        }
    }
    /**
     * Move the modal window to the positions indicated.
     * @param {Object} modal
     * @param {Number} coordX
     * @param {Number} coordY
     */
    function move(modal, coordX, coordY) {
        modal.style.left = coordX + 'px';
        modal.style.top = coordY + 'px';

        if (defaults.showMessages) {
            console.info("TomloprodModal: Dragging. Coord X: " + coordX + 'px | Coord Y: ' + coordY + 'px');
        }
    }
	
	TomloprodModal.prototype.getKey = function(event) {
        event = event || window.event;
        //////////// Esc
        if (event.keyCode === 27) {
            this.closeModal();
        }
	};
	
	function openOnClick(e){
	    if (e.target === document.body){ 
			return;
		}
	    var elem = findParentWithDataModal(e.target);	
		if (elem instanceof Element && hasClass(elem, 'tm-trigger')) {
			if(typeof elem !== "undefined"){
				openModal("#"+elem.getAttribute('data-tm-modal'));
				e.preventDefault();
			}
		}
	}
	
	//////////// Apply individual configuration (with data attributes or param inside openModal) when the openModal method is called.
	TomloprodModal.prototype.applyIndividualConfig = function(params){
		var attr = null;
		for (var i = 0; i < this.modal.attributes.length; i++) {
			attr = this.modal.attributes[i];
			// If attribute nodeName starts with 'data-'
			if (/^data-/.test(attr.nodeName)) {
				switch(attr.nodeName){
					case "data-tm-content": 
					this.modal.getElementsByClassName('tm-content')[0].innerHTML = attr.nodeValue; 
					break;
					case "data-tm-title": 
					this.modal.getElementsByClassName('tm-title-text')[0].innerHTML = attr.nodeValue; 
					break;
					case "data-tm-bgcolor":
						addPropertyValueFromClasses(this.modal.getElementsByClassName("tm-wrapper"), "backgroundColor", attr.nodeValue);
					break;
					case "data-tm-textcolor":
						addPropertyValueFromClasses(this.modal.getElementsByClassName("tm-content"), "color", attr.nodeValue);
						addPropertyValueFromClasses(this.modal.getElementsByClassName("tm-wrapper"), "color", attr.nodeValue);
					break;		
					case "data-tm-closetimer":
						this.closeTimeout = setTimeout(this.closeModal.bind(this), attr.nodeValue);
					break;					
					
				}
			}
		}
		if(typeof params !== "undefined"){
			var configOption = null;
			if (typeof params !== "undefined") {
				for (configOption in params) {
					if (typeof params[configOption] !== "undefined") {
						switch (configOption) {
							case "title":
							this.modal.getElementsByClassName('tm-title-text')[0].innerHTML = params[configOption]; 
							break;
							case "borderRadius":
								addPropertyValueFromClasses(document.getElementsByClassName("tm-wrapper"), "-webkit-border-radius", params[configOption]);
								addPropertyValueFromClasses(document.getElementsByClassName("tm-wrapper"), "-moz-border-radius", params[configOption]);
								addPropertyValueFromClasses(document.getElementsByClassName("tm-wrapper"), "border-radius", params[configOption]);
							break;
							case "content":
								this.modal.getElementsByClassName('tm-content')[0].innerHTML = params[configOption]; 
							break;
							case "bgColor":
								addPropertyValueFromClasses(this.modal.getElementsByClassName("tm-wrapper"), "backgroundColor", params[configOption]);
							break;
							case "textColor":
								addPropertyValueFromClasses(this.modal.getElementsByClassName("tm-content"), "color", params[configOption]);
								addPropertyValueFromClasses(this.modal.getElementsByClassName("tm-wrapper"), "color", params[configOption]);
							break;
							case "closeTimer":
								this.closeTimeout = setTimeout(this.closeModal.bind(this), params[configOption]);
							break;								
						}
					}
				}
			}
		
		}
	};


	TomloprodModal.prototype.registerHandler = function (event, callback) {
		var added = true;
		if (this.handlers[event]) {
			if (indexOf(this.handlers[event], callback) === -1) {
				this.handlers[event].push(callback);
			} else {
				added = false;
				console.error("TomloprodModal: The event ''" + event + "'' already contain one handler with the next function:\n\n " + callback);
			}
		} else {
			this.handlers[event] = [callback];
		}
		if (defaults.showMessages && added) {
			console.info("TomloprodModal: There are one new handler registered to the event ''" + event + "'':\n\n " + callback + ". \n\nTotal handlers of ''" + event + "'' event: " + this.handlers[event].length);
		}
	};

	TomloprodModal.prototype.removeHandler = function (event, callback) {
		if (this.handlers[event]) {
			callback = callback || false;

			if (callback) {
				var i = indexOf(this.handlers[event], callback);
				if (i > -1) {
					this.handlers[event].splice(i, 1);
				} else {
					return false;
				}
				if (defaults.showMessages) {
					console.info("TomloprodModal: The handlers with the name ''" + event + "'' have been deleted successfully. (" + callback + ")");
				}
				return true;
			}
			delete this.handlers[event];
			if (defaults.showMessages) {
				console.info("TomloprodModal: The handler ''" + event + "'' has been deleted successfully. (" + callback + ")");
			}
		} else {
			return false;
		}
	} ;

	TomloprodModal.prototype.fire = function (event) {
		if (!this.handlers[event]) {
			if (defaults.showMessages) {
				console.info("TomloprodModal: There aren't any handlers registered for ''" + event + "''");
			}
			return false;
		}
		var i;
		for (i = 0; i < this.handlers[event].length; i += 1) {
			this.handlers[event][i].apply(window, Array.prototype.slice.call(arguments, 1));
		}
	} ;

	TomloprodModal.prototype.closeModal = function (event) {
		if (typeof event !== "undefined") {
			event.stopPropagation();
		}
		
		window.clearTimeout(this.closeTimeout);
		removeClass(this.mainContainer, 'tm-effect');
		removeClass(this.modal, 'tm-showModal');
		this.closeButton.removeEventListener('click', this.closeModal, false);
		if(this.isOpen){
			var inputsText = this.modal.querySelectorAll('.tm-emptyOnClose'), conta = 0;
			for (conta = 0; conta < inputsText.length; conta += 1) {
				if (inputsText[conta].tagName === "INPUT") {
					inputsText[conta].value = "";
				} else {
					inputsText[conta].innerHTML = "";
				}
			}
		}
		this.stopDragging(this.modal);
		this.modal = null;
		this.isOpen = false;
		this.fire("closed");
		var indexInStack = modalStack.indexOf(this) ;
		if(indexInStack !== -1){
			modalStack.splice(indexInStack, 1) ;
		}
	},
	/** DRAG METHODS **/
	/**
	 * Starts the dragging of modal window.
	 * @param {Object} modal
	 * @param {Event} event
	 */
	TomloprodModal.prototype.startDragging = function (event) {
		if(!this.modal){ return; }
		event = event || window.event;
		this.modal.style.cursor = 'move';
		draggingModal = this.modal ;
		draggingPosition = {} ;
		draggingPosition.modalTop = this.modal.offsetTop;
		draggingPosition.modalLeft = this.modal.offsetLeft;
		draggingPosition.halfWidthModal = this.modal.offsetWidth / 2;
		draggingPosition.halfHeightModal = this.modal.offsetHeight / 2;
		draggingPosition.widthWindow = parseInt(window.innerWidth, 10);
		draggingPosition.heightWindow = parseInt(window.innerHeight, 10);
		draggingPosition.differenceX = event.clientX - draggingPosition.modalLeft;
		draggingPosition.differenceY = event.clientY - draggingPosition.modalTop;
		
	};

	

	/**
	 * Method called when stopped the dragging of the modal window.
	 * @param {Object} modal
	 */
	TomloprodModal.prototype.stopDragging = function () {
		draggingModal = null;
		if(typeof this.modal.style !== "undefined"){
			this.modal.style.cursor = 'default';
			removeClass(document.getElementsByTagName("body")[0], 'tm-avoidSelection');
			removeClass(this.modal, 'tm-avoidSelection');
			this.fire('stopDragging');
		}
	} ;

	function onMove(event) {
		if(!draggingModal){ return ;}
		event = event || window.event;
		
		// Drag end position
		var modalX = event.clientX - draggingPosition.differenceX,
				modalY = event.clientY - draggingPosition.differenceY;

		// X Control
		if (modalX < draggingPosition.halfWidthModal) {
			modalX = draggingPosition.halfWidthModal;
		}
		if (modalX + draggingPosition.halfWidthModal > draggingPosition.widthWindow) {
			modalX = draggingPosition.widthWindow - draggingPosition.halfWidthModal;
		}
		// Y Control
		if (modalY < draggingPosition.halfHeightModal) {
			modalY = draggingPosition.halfHeightModal;
		}
		if (modalY + draggingPosition.halfHeightModal > draggingPosition.heightWindow) {
			modalY = draggingPosition.heightWindow - draggingPosition.halfHeightModal;
		}
		addClass(document.getElementsByTagName("body")[0], 'tm-avoidSelection');
		addClass(draggingModal, 'tm-avoidSelection');
		move(draggingModal, modalX, modalY);
	};

	document.addEventListener("click", openOnClick);
	document.addEventListener("mousemove", onMove);

	function openModal(modalQueryOrElement, params) {
		if(!document.querySelector(".tm-overlay")){
			//////////// Create modal overlay
			var overlay = document.createElement("DIV");
			overlay.className = "tm-overlay";
			document.body.appendChild(overlay);

			overlay.addEventListener("click", function(){
				if(modalStack.length>0 && modalStack[modalStack.length-1].closeOnOverlay && !modalStack[modalStack.length-1].removeOverlay){
					modalStack[modalStack.length-1].closeModal() ;
				}
			}, false) ;
			
		}

		var tomModal = new TomloprodModal() ;
		modalStack.push(tomModal) ;
	
		tomModal.modal = modalQueryOrElement;
		if(typeof(modalQueryOrElement) === "string"){
			tomModal.modal = document.querySelector(modalQueryOrElement);
		}
		if (tomModal.modal) {

			tomModal.modal.style.zIndex = 2000 + modalStack.length ;

			if(defaults.mainContainer){
				addClass(defaults.mainContainer, "tm-effect");
			}
			
			//////////// Individual configuration (data attributes) and params
			if(!params){
				params = defaults ;
			}
			tomModal.applyIndividualConfig(params);
			
			if (params.draggable || hasClass(tomModal.modal, "tm-draggable")) {
				tomModal.modal.querySelector(".tm-title").onmousedown = tomModal.startDragging.bind(tomModal) ;
				tomModal.modal.querySelector(".tm-title").onmouseup = tomModal.stopDragging.bind(tomModal) ;
			}
			addClass(tomModal.modal, 'tm-showModal');
			tomModal.closeButton = tomModal.modal.querySelector('.tm-closeButton');
			
			tomModal.closeButton.onclick = tomModal.closeModal.bind(tomModal);
			
			
			if (tomModal.closeOnEsc) {
				document.onkeyup = tomModal.getKey.bind(tomModal);
			}
			tomModal.isOpen = true;
			tomModal.fire('opened');
		} else if (defaults.showMessages) {
			console.error("TomloprodModal: Cannot find the indicated modal window.");
		}
	} 
	
	
	function create(params){
	
		//////////// Create default modal window
		var defaultModalWindow = document.createElement("DIV");
		defaultModalWindow.className = "tm-modal tm-effect tm-draggable";
			//////////// Create wrapper 
			var defaultModalWrapper = document.createElement("DIV");
			defaultModalWrapper.className = "tm-wrapper";
			defaultModalWindow.appendChild(defaultModalWrapper);
				//////////// Title
				var defaultModalTitle = document.createElement("DIV");
				defaultModalTitle.className = "tm-title";
				defaultModalWrapper.appendChild(defaultModalTitle);
					//////////// Xbutton
					var defaultModalTitleXButton = document.createElement("SPAN");
					defaultModalTitleXButton.className = "tm-XButton tm-closeButton";
					defaultModalTitle.appendChild(defaultModalTitleXButton);
					//////////// Title h3
					var defaultModalTitleH3 = document.createElement("H3");
					defaultModalTitleH3.className = "tm-title-text";
					defaultModalTitle.appendChild(defaultModalTitleH3);
				//////////// Content
				var defaultModalContent = document.createElement("DIV");
				defaultModalContent.className = "tm-content";
				defaultModalWrapper.appendChild(defaultModalContent);
				
				document.body.insertBefore(defaultModalWindow, document.body.firstChild);
	
		openModal(defaultModalWindow, params);
	
	}
	
	function setDefaults(params) {
				
	
		if (typeof params !== "undefined") {
			Object.keys(params).forEach(function(configOption){
				defaults[configOption] = params[configOption] ;
			}) ;
		}
			
		
	}
	
    return {
        openModal: openModal,
        create: create,
        setDefaults: setDefaults
			
			// stop: function () {
			//     document.onclick = null;
			//     var aHrefs = document.getElementsByTagName("A");
			//     for (var x = 0; x < aHrefs.length; x++) {
			//         var el = aHrefs[x];
			//         el.onclick = null;
			//     }
			// },
			
	};
}());

