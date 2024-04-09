// ==UserScript==
// @name         OP Connect To anki
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add some buttons to qcms
// @author       Jonas
// @downloadURL  https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/script.user.js
// @updateURL    https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/script.user.js
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
    var UeDefault = 13;
    var mobile = true;
    //var correctionSerie = $._data($('.serie :submit')[0], 'events').click[0].handler;

    window.addToAnki = function(e, i) {
       sync1++;
       var qcm = qcms[i];
       console.log(i);
       console.log(qcmNumber);
       console.log(ue);
       var recto = qcm.qst;
       if(e.shiftKey) {
           recto = enonce + " " + recto;
       };
       console.log(recto);
       console.log(qcm.answ);
       const data = {
           deck: "Pass::Erreurs OP::UE"+ue,
           recto: recto,
           verso: qcm.answ,
           tags: "p_OP"+ " " + getAnnaleTag() + " " + "type_Erreur" + " " + "z_"+qcmNumber + " " + "UE"+ue+"_"
       };
       if(mobile) {

           const searchParams = new URLSearchParams(data);

           // searchParams.toString() === 'var1=value1&var2=value2';

           openLink("https://ankiuser.net/add?"+searchParams.toString())
           //window.open();
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
        var chaineRegex = "\\(Annales ([0-9]{4})\/([0-9]{4})\\)";;
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
        var chaineRegex = "UE( spÃ© )?([0-9]+)";
        var regex = new RegExp(chaineRegex);
        var regexResult = regex.exec(completeUe);
        ue = regexResult == undefined ? UeDefault : regexResult[2];
        return ue;
    }
    function getEnonce() {
        var completeEnonceElement = document.querySelector('.QCM_enonce');
        enonce = completeEnonceElement == undefined ? "Enonce Nulle" : completeEnonceElement.innerText.trim();
        return enonce;
    }
    function openLink(link) {
        var a = document.createElement('a');
        a.href = link;
        a.target= "_blank";
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    function addButton() {
        getQcmNumber();
        getUe();
        console.log(getEnonce());
        var i = 0;
        var questions = document.querySelectorAll('.QCM_question');
        document.querySelectorAll('.QCM_ligne_explication').forEach(function(answer) {
            var qst = questions[i].innerText
            var answ = answer.querySelector('.QCM_explication').innerHTML.trim()
            qcms[i] = {qst: qst, answ: answ};
            var buttonToCatch = document.createElement('button');
            buttonToCatch.id = 'addToAnki_' + i;
            buttonToCatch.className = 'bouton_bleu';
            buttonToCatch.style = 'padding: 5px; font-size: 10px';
            buttonToCatch.innerText = 'Ajouter Ã  Anki';
            answer.appendChild(buttonToCatch);
            answer.classList.add("centerClass");
            buttonToCatch.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                i = e.srcElement.id.replace('addToAnki_', '');
                addToAnki(e,i);
            })
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
      var nb_max = $explication.length;// gÃ©nÃ©ralement 5, mais 6 pour Montpellier avec l'item F
      for(var i=0;i<nb_max;i++){
         if ($explication.eq(i).hasClass('juste') | isAll){
         //if(true) {
             $explication.eq(i).toggle(toggleTime);
         }
      }
      /* re-calcul les formules de math qui Ã©taient cachÃ©es  */
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
}
})();
