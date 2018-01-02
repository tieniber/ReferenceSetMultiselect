/*globals define */
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "dojo/text!ReferenceSetMultiSelect/widget/template/ReferenceSetMultiSelect.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";

    return declare("ReferenceSetMultiSelect.widget.ReferenceSetMultiSelect", [_WidgetBase, _TemplatedMixin], {

        templateString: widgetTemplate,


        widgetBase: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _referenceSetToChange: null,
        _referenceSetToListen: null,
        _attrHandle: null,

        constructor: function() {
            this._handles = [];
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this.connect(this.selectNode, "change", this._selectionChanged);

			//set single or multi-select
			var att;
			if(this.multiselect) {
				att = document.createAttribute("multiple");
				this.selectNode.setAttributeNode(att);
			} else {
				att = document.createAttribute("size");
				att.value = "4";
				this.selectNode.setAttributeNode(att);
			}

            this._referenceSetToChange = this.associationToSet.split("/")[0];
            this._referenceSetToListen = this.pathToListen.split("/")[0];
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._updateRendering(callback);
            this._resetSubscriptions();
        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },

        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");
            //empty the node
            this.selectNode.innerHTML = "";
            this._selectionChanged();

            //and refill it
            if (this.useConstraint) {
                //constrained path
                var splitPath = this.pathToListen.split("/");
                mx.data.get({
                    guid: this._contextObj.getGuid(),
                    path: splitPath[0],
                    callback: function(objs) {
                        dojoLang.hitch(this, this._getListObjects, objs, false)();
                    }
                }, this);
            } else {
                //just xpath
                this._getListObjects([], true);            }
            if (callback) callback();
        },
        _getListObjects: function(objs, allIfEmpty) {
            var curObj, splitPath,
            args = {};

            args.callback =  function(objs2) {
                dojoLang.hitch(this, this._setupOptions, objs2)();
            }
            args.xpath = "//" + this.listEntity;

            if (objs.length > 0) {
                //splitPath = this.pathFromListener.split("/");
                args.xpath = "//" + this.listEntity + "[" + this.pathFromListener + "[";
                for (var i = 0; i < objs.length; i++) {
                    curObj = objs[i];
                    if (i>0) {
                        args.xpath = args.xpath + " or ";
                    }
                    args.xpath = args.xpath + "id='" + curObj.getGuid().toString() + "'";
                }
                args.xpath = args.xpath + "]]";
            } else if (!allIfEmpty) {
                return;
            }
            if (this.sortAttribute) {
                args.filter = {};
                args.filter.sort = [ [ this.sortAttribute, this.sortDirection ] ];
            }

            mx.data.get(args, this);
        },
        _setupOptions: function(objs) {
            var tempOption, curObj, objLabel, objValue;

            //if sorting attribute is specified, sort the array of objs
            if(this.sortAttribute) {
                var attr = this.sortAttribute;
                if (this.sortDirection === "asc") {
                    objs.sort((a, b) => a.get(attr).toLowerCase().localeCompare(b.get(attr).toLowerCase()));
                } else {
                    objs.sort((a, b) => b.get(attr).toLowerCase().localeCompare(a.get(attr).toLowerCase()));
                }
            }

            for (var i = 0; i < objs.length; i++) {
                curObj = objs[i];
                objLabel = curObj.get(this.labelAttribute);
                objValue = curObj.getGuid();
                tempOption = dojoConstruct.toDom("<option value='" + objValue + "'>" + objLabel + "</option>");
                this.selectNode.appendChild(tempOption);
            }
        },
        _selectionChanged: function() {
            this._contextObj.set(this._referenceSetToChange, this._getSelectValues(this.selectNode));
            if (this.onChangemf) {
                mx.data.action({
                    params: {
                        applyto: "selection",
                        actionname: this.onChangemf,
                        guids: [this._contextObj.getGuid()]
                    },
                    origin: this.mxform,
                    callback: function(obj) {},
                    error: function(error) {
                        alert(error.message);
                    }
                });
            }
        },
        _getSelectValues: function(select) {
            var result = [];
            var options = select && select.options;
            var opt;

            for (var i = 0, iLen = options.length; i < iLen; i++) {
                opt = options[i];

                if (opt.selected) {
                    result.push(opt.value || opt.text);
                }
            }
            return result;
        },

        _unsubscribe: function() {
            if (this.attrHandle) {
                mx.data.unsubscribe(this.attrHandle);
            }
            //if (this.objHandle) {
            //	mx.data.unsubscribe(this.objHandle);
            // }
        },
        _resetSubscriptions: function() {
            if (this._contextObj && this._referenceSetToListen) {
                this._unsubscribe();
                this.attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this._referenceSetToListen,
                    callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });
            }
        },

    });
});

require(["ReferenceSetMultiSelect/widget/ReferenceSetMultiSelect"]);
