// ==UserScript==
// @name         Objectif Pass Anki To Connect
// @namespace    http://tampermonkey.net/
// @version      1.3
// @updateURL    https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/script.user.js
// @description  Adding buttons on OP to redirect to Anki
// @author       Jonas Cohen
// @match        https://www.objectifpass.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=objectifpass.fr
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    //console.log($._data($('.serie :submit')[0], 'events'))
    var styleTag = document.createElement("style");
    styleTag.innerHTML = ".centerClass { text-align: center; } .notDisplay{ display:none ! important;}";
    document.head.appendChild(styleTag);
    var qcms = {}, qcmNumber, ue, enonce, annaleTag;
    var sync1 = 0;
    var sync2 = 0;
    var UeDefault = 12;
    var mobile = navigator.userAgentData ? navigator.userAgentData.mobile : true;
    var timeouts = [];
    var maxIntervalClick = 900;
    //var correctionSerie = $._data($('.serie :submit')[0], 'events').click[0].handler;

    window.addToAnki = function(e, i) {
       sync1++;
       if(timeouts) {
           e.nbClick = timeouts.length;
           console.log(e.nbClick);
           timeouts.forEach(function(timeout) {clearTimeout(timeout)});
           timeouts = [];
       }
       var qcm = qcms[i];
       var recto = qcm.qst;
       var verso = qcm.answ;
       if(e.altKey) {
           mobile = true;
       }
       if(e.ctrlKey | e.nbClick == 3) {
           recto = "<ul>";
           verso = "<ul>";
           for (var key in qcms) {
               var qcmElement = qcms[key];
               if(key != 0){
                   verso+= "<br>";
               }
               if(qcmElement.isTrue) {
                   verso += "<li><span style=\"color: #00ff00;\">";
               } else {
                   verso += "<li><span style=\"color: #ff5500\">";
               }
               var spanError = "<span>";
               if(qcmElement.isIncorrect) {
                  spanError = "<span style=\"color: #ffaa00;\">";
               }
               recto += "<li>"+qcmElement.qst+ "</li>";
               verso += qcmElement.qst + "</span><br> ==> "+ spanError + qcmElement.answ+"</span></li>";
           };
           recto += "</ul>";
           verso += "</ul>";
      }
       if((e.shiftKey && e.ctrlKey) | e.nbClick == 3) {
           recto = enonce.replace(/\(Annales ([0-9]{4})\/([0-9]{4})\)/g, '') + " " + recto;
       } else if(e.shiftKey | e.nbClick == 2) {
           recto = enonce.replace(/\(Annales ([0-9]{4})\/([0-9]{4})\)/g, '') + " <br>" + recto;
       };
       const data = {
           deck: "Pass::Erreurs OP::UE"+ue,
           recto: recto,
           verso: verso,
           tags: "p_OP"+ " " + getAnnaleTag() + " " + "type_Erreur" + " " + "z_"+qcmNumber + " " + "UE"+ue+"_"
       };
       if(mobile) {

           const searchParams = new URLSearchParams(data);
           // searchParams.toString() === 'var1=value1&var2=value2'
           window.open("https://ankiuser.net/add?"+searchParams.toString());
       } else {
           var dataToAdd = {
               "action": "guiAddCards",
               "version": 6,
               "params": {
                   "note": {
                       "deckName": data.deck,
                       "modelName": "Basique",
                       "fields": {
                           "Recto": data.recto,
                           "Verso": data.verso
                       },
                       "tags": data.tags.split(" ").filter(function(val){return val !== ''} )
                   }
               }
           }
           console.log(dataToAdd);
           invoke(dataToAdd);
       }
       return false;
    }
    function correct() {
        //correctionSerie();
        addButton();
    }
    function getAnnaleTag() {
        enonce = getEnonce();
        var chaineRegex = "\\(Annales ([0-9]{4})\/([0-9]{4})\\)";
        var regex = new RegExp(chaineRegex);
        var regexResult = regex.exec(enonce);
        annaleTag = regexResult == undefined ? "" : "y_annale_"+regexResult[1]+"-"+regexResult[2];
        return annaleTag;
    }
    function getQcmNumber() {
        var openFormElement = document.querySelector('#threadOpenForm div.text')
        var openForm = openFormElement == undefined ? "" : openFormElement.innerText;
        var chaineRegex = "Poser une question sur le QCM ([0-9]*) \\?";
        var regex = new RegExp(chaineRegex);
        var regexResult = regex.exec(openForm);
        qcmNumber = regexResult == undefined ? "9999" : regexResult[1];
        return qcmNumber;
    }
    function getUe() {
        var completeUeElement = document.querySelector('#sidebar p');
        var completeUe = completeUeElement == undefined ? "" : completeUeElement.innerText;
        var chaineRegex = "UE( spé )?([0-9]+)";
        var regex = new RegExp(chaineRegex);
        var regexResult = regex.exec(completeUe);
        ue = regexResult == undefined ? UeDefault : regexResult[2];
        return ue;
    }
    function getEnonce() {
        var completeEnonceElement = document.querySelector('.QCM_enonce');
        enonce = completeEnonceElement == undefined ? "Enonce Nulle" : completeEnonceElement.innerText.trim();
        return enonce+ "<br>";
    }
    function addButton() {
        getQcmNumber();
        getUe();
        getEnonce();
        var i = 0;
        var questions = document.querySelectorAll('.QCM_question');
        document.querySelectorAll('.QCM_ligne_explication').forEach(function(answer) {
            var qst = questions[i].innerText
            var answ = answer.querySelector('.QCM_explication').innerHTML.trim()
            var isTrue = answer.classList.contains('vrai');
            var isIncorrect = answer.classList.contains('erreur');
            qcms[i] = {qst: qst, answ: answ, isTrue: isTrue, isIncorrect: isIncorrect};
            var buttonToCatch = document.createElement('button');
            buttonToCatch.id = 'addToAnki_' + i;
            buttonToCatch.className = 'bouton_bleu';
            buttonToCatch.style = 'padding: 5px; font-size: 10px';
            buttonToCatch.innerText = 'Ajouter à Anki';
            answer.appendChild(buttonToCatch);
            answer.classList.add("centerClass");
            buttonToCatch.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                i = e.srcElement.id.replace('addToAnki_', '');
                timeouts.push(setTimeout(function() {addToAnki(e,i)}, maxIntervalClick));
            });
            i++;
        })
        try{$._data($('.serie .QCM_block').css('cursor','pointer')[0], 'events').click[0].handler = toogleCorrection} catch{return false};
    }
    window.addButton = addButton;
    //$('.serie :submit').off('click', correctionSerie);
    addButton();
    $('.serie :submit').on('click', addButton);
    $(document).on('ajaxPageLoad',function(event){$('.serie :submit').on('click', addButton);});

    function toogleCorrection(element = this, isAll = false, toggleTime = 150){
        if(sync1==sync2) {
              var $explication = $(element).find('.QCM_ligne_explication');
      var nb_max = $explication.length;// généralement 5, mais 6 pour Montpellier avec l'item F
      for(var i=0;i<nb_max;i++){
         if ($explication.eq(i).hasClass('juste') | isAll){
         //if(true) {
             $explication.eq(i).toggle(toggleTime);
         }
      }
      /* re-calcul les formules de math qui étaient cachées  */
      $explication.each(function(){
			MathJax.Hub.Queue(["Rerender", MathJax.Hub, this]);
		})
        } else {sync2++;}

    }
    window.toogleExplication = function() {toogleCorrection($('.QCM_block'), true)};
    window.toogleExplicationOnLoad = function() {toogleCorrection($('.QCM_block'), true, 0)};

    window.invoke = function (data) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('error', () => reject('failed to issue request'));
        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (Object.getOwnPropertyNames(response).length != 2) {
                    throw 'response has an unexpected number of fields';
                }
                if (!response.hasOwnProperty('error')) {
                    throw 'response is missing required error field';
                }
                if (!response.hasOwnProperty('result')) {
                    throw 'response is missing required result field';
                }
                if (response.error) {
                    throw response.error;
                }
                resolve(response.result);
            } catch (e) {
                reject(e);
            }
        });

        xhr.open('POST', 'http://127.0.0.1:8765');
        xhr.send(JSON.stringify(data));
    });

if(window.location.pathname.includes('qcm/affiche-')) {
    var toggle = 0;
    var innerOriginal;
    window.onload = function() {innerOriginal = structuredClone(document.querySelector('.QCM_block').innerHTML); toggleSerieCorrectionAlwreadyDone(true); $('.QCM_question').css('cursor','pointer').on('click',toggleSerieCorrectionAlwreadyDone);};
    function toggleSerieCorrectionAlwreadyDone(firstTime) {
        var elementToOuter = document.querySelectorAll('.QCM_reponse');
        var button = '<a class="QCM_reponse switch icons"><span class="ss-on" style="display: none;"></span><span class="ss-slider" style="left: 0px;"></span></a>';
        if(firstTime) {
            elementToOuter.forEach(function(e) {e.classList.add('answerItem')});
            elementToOuter.forEach(function(e) {e.classList.toggle('notDisplay')});
            elementToOuter.forEach(function(e) {e.insertAdjacentHTML('beforebegin', '<a class="QCM_reponse switch icons ss_alreadyOn"><span class="ss-on" style="display: none;"></span><span class="ss-slider" style="left: 0px;"></span></a>');});
            toogleExplicationOnLoad()
        }else {
            toogleExplication()
        };
        if(!toggle) {

        } else {
            document.querySelector('.QCM_block').innerHTML = innerOriginal;
            document.querySelectorAll('.QCM_ligne_explication .bouton_bleu').forEach(function(element) {element.remove();});
            addButton();
            $('.QCM_question').css('cursor','pointer').on('click',toggleSerieCorrectionAlwreadyDone)
        }
        toggle = toggle == 0 ? 1 : 0;
    }
}
}
})();