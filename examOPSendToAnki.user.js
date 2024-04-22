// ==UserScript==
// @name         Exam OP Connect To Anki
// @namespace    http://tampermonkey.net/
// @version      2.0
// @updateURL    https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/ExamOPSendToAnki.user.js
// @downloadURL  https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/ExamOPSendToAnki.user.js
// @description  Adding buttons on OP to redirect to Anki and other cool tools
// @author       Jonas Cohen
// @match        https://www.objectifpass.fr/entrainement/exam_corrige*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=objectifpass.fr
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    //Personaliser qcm affiche pour ne pas afficher directement les réponses
    if (window.location.pathname.includes('entrainement/exam_corrige')) {

        window.addEventListener("load", function() {
            addButton();
        });
        //AJOUTER LES BOUTONS ET TOUTES LES FONCTIONS DE RECUPERATION DE DONNEES
        //A EXECUTER SUR TOUS LES SITES OBJECTIF PASS
        let styleTag = document.createElement("style");
        styleTag.innerHTML = ".centerClass { text-align: center; } .notDisplay{ display:none ! important;}";
        document.head.appendChild(styleTag);
        var allQcms = {};
        var timeouts = {
            running: [],
            cleared: []},
        sync1 = 0,
        sync2 = 0,
        ue,
        annaleTag;
        //VARIABLES SYNC PERMETTENT DE VOIR SI LE CLICK SUR LE QCMBLOCK QUI TOGGLE LA CORRECTION COINCIDE AVEC UN CLICK SUR UN BOUTON CONTENU A L'INTERIEUR ET DONC ADDTOANKI AUQUEL CAS IL FAUT EMPECHER LE TOGGLE DE FAIRE CELA CAR JE VEUX CONSERVER LE CLICK SUR TOUT LE QCM BLOCK
        const UeDefault = 12,
        mobile = navigator.userAgentData ? navigator.userAgentData.mobile: true,
        maxIntervalClick = 200;
        //var correctionSerie = $._data($('.serie :submit')[0], 'events').click[0].handler;

        window.addToAnki = function(e, q, i) {
            sync1++;
            //ON DESYNCHRONISE sync1 et sync2  ON REAJUSTERA sync2 A LA FIN DU TOOGLE

            //COMPTE LE NOMBRE DE TIMEOUTS CLEARED ENTRE PLUSIEURS CLICK SI L'INTERVALLE ENTRE DEUX CLICK EST TOUJOURS + PETIT QIE 200ms (maxIntervalClick)
            e.nbClick = timeouts.cleared.length + 1;
            console.log(e.nbClick);
            timeouts.cleared = [];
            timeouts.running = [];
            var fullQcm = allQcms[q];
            var qcms = fullQcm.qcms;
            var qcm = qcms[i];
            var qcmNumber = fullQcm.qcmNumber;
            var recto = qcm.qst;
            var enonce = fullQcm.enonce;
            var verso = qcm.answ;
            var simulateMobile = mobile;
            var dataToAdd = {
                "action": "multi",
                "params": {
                    "actions": []
                }
            }
            if (e.altKey) {
                simulateMobile = true;
            }
            if (e.ctrlKey | e.nbClick >= 3) {
                recto = "<ul>";
                verso = "<ul>";
                for (var key in qcms) {
                    var qcmElement = qcms[key];
                    if (key != 0) {
                        verso += "<br>";
                    }
                    if (qcmElement.isTrue) {
                        verso += "<li><span style=\"color: #00ff00;\">";
                    } else {
                        verso += "<li><span style=\"color: #ff5500\">";
                    }
                    var spanError = "<span>";
                    if (qcmElement.isIncorrect) {
                        spanError = "<span style=\"color: #ffaa00;\">";
                    }
                    recto += "<li>" + qcmElement.qst + "</li>";
                    verso += qcmElement.qst + "</span><br> ==> " + spanError + qcmElement.answ + "</span></li>";
                };
                recto += "</ul>";
                verso += "</ul>";
            }
            if ((e.shiftKey && e.ctrlKey) | e.nbClick >= 3) {
                recto = enonce.replace(/\(Annales ([0-9]{4})\/([0-9]{4})\)/g, '') + " " + recto;
            } else if (e.shiftKey | e.nbClick == 2) {
                recto = enonce.replace(/\(Annales ([0-9]{4})\/([0-9]{4})\)/g, '') + " <br>" + recto;
            };
            var dataEnonceImg = "",
            dataCorrectionImg = "";
            if (!simulateMobile) {
                var enonceImg = fullQcm.qcmBlock.querySelector('img.enonce'),
                correctionImg = fullQcm.qcmBlock.querySelector('img.correction');

                if (enonceImg) {
                    var enonceSrc = enonceImg.src;
                    var fileNameEnonce = enonceSrc.replace('https://www.objectifpass.fr/qcm_images/', '');

                    dataEnonceImg = {
                        "action": "storeMediaFile",
                        "params": {
                            "filename": fileNameEnonce,
                            "url": enonceSrc
                        }
                    }
                    dataToAdd.params.actions.push(dataEnonceImg);
                    dataEnonceImg = "<br><img  src=\"" + fileNameEnonce + "\">";
                }
                if (correctionImg) {
                    var correctionSrc = correctionImg.src
                    var fileNameCorrection = correctionSrc.replace('https://www.objectifpass.fr/qcm_images/', '');
                    dataCorrectionImg = {
                        "action": "storeMediaFile",
                        "params": {
                            "filename": fileNameCorrection,
                            "url": correctionSrc
                        }
                    }
                    dataToAdd.params.actions.push(dataCorrectionImg);
                    dataCorrectionImg = "<img  src=\"" + fileNameCorrection + "\"><br>";
                }
            }
            recto = recto + dataEnonceImg;
            verso = dataCorrectionImg + verso;
            const data = {
                deck: "Pass::Erreurs OP::UE" + ue,
                recto: recto,
                verso: verso,
                tags: "p_OP_Exam" + " " + annaleTag + " " + "type_Erreur" + " " + "z_" + qcmNumber + " " + "UE" + ue + "_"
            };
            if (simulateMobile) {
                const searchParams = new URLSearchParams(data);
                navigator.clipboard.writeText("https://ankiuser.net/add#?" + searchParams.toString());
                window.open("https://ankiuser.net/add#?" + searchParams.toString());
            } else {
                var actionToAdd = {
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
                            "tags": data.tags.split(" ").filter(function(val) {
                                return val !== ''
                            })
                        }
                    }
                }
                dataToAdd.params.actions.push(actionToAdd);
                console.log(dataToAdd);
                invoke(dataToAdd);
            }
            return false;
        }


        function getQcmNumber(qcmBlock) {
            var openFormElement = qcmBlock.querySelector('p.centerH')
            var openForm = openFormElement == undefined ? "": openFormElement.innerText;
            var chaineRegex = "\\(QCM ([0-9]*)\\)";
            var regex = new RegExp(chaineRegex);
            var regexResult = regex.exec(openForm);
            var qcmNumber = regexResult == undefined ? "9999": regexResult[1];
            return qcmNumber;
        }

        function getUeAndAnnale() {
            var completeUeElement = document.querySelector('#main h1');
            var completeUe = completeUeElement == undefined ? "": completeUeElement.innerText;
            var chaineRegex = "Correction Annales ([0-9]{4})-([0-9]{4}) UE( spé )?([0-9]+)";
            var regex = new RegExp(chaineRegex);
            var regexResult = regex.exec(completeUe);
            ue = regexResult == undefined ? "0": regexResult[4];
            annaleTag = regexResult == undefined ? "undefined": "y_annale_" + regexResult[1] + "-" + regexResult[2];
            return {
                ue: ue,
                annale: annaleTag
            };
        }

        function getEnonce(qcmBlock) {
            var completeEnonceElement = qcmBlock.querySelector('.QCM_enonce');
            var enonce = completeEnonceElement == undefined ? "Enonce Nulle": completeEnonceElement.innerHTML.trim();
            return enonce + "<br>";
        }

        function addButton() {
            getUeAndAnnale();
            var q = 0;
            var allQcmsElements = document.querySelectorAll('.qcmExam');
            allQcmsElements.forEach(function(qcmBlock) {
                var i = 0;
                var questions = qcmBlock.querySelectorAll('.QCM_question');
                q = qcmBlock.id.substr(3);
                var qcms = [];
                var enonce = getEnonce(qcmBlock);
                var qcmNumber = getQcmNumber(qcmBlock);
                qcmBlock.querySelectorAll('.QCM_ligne_explication').forEach(function(answer) {
                    var qst = questions[i].innerHTML.trim();
                    var answ = answer.querySelector('.QCM_explication').innerHTML.trim()
                    var isTrue = answer.classList.contains('vrai');
                    var isIncorrect = answer.classList.contains('erreur');
                    qcms[i] = {
                        qst: qst,
                        answ: answ,
                        isTrue: isTrue,
                        isIncorrect: isIncorrect
                    };
                    if (mobile) {
                        var buttonToCatch = document.createElement('span');
                        var eventToCatch = "touchend";
                    } else {
                        var buttonToCatch = document.createElement('button');
                        var eventToCatch = "click";
                    }
                    buttonToCatch.id = 'addToAnki_' + q + "_" + i;
                    buttonToCatch.className = 'bouton_bleu';
                    buttonToCatch.style = 'padding: 5px; font-size: 10px; display: inline-block;';
                    buttonToCatch.innerText = 'Ajouter à Anki';
                    answer.appendChild(buttonToCatch);
                    answer.classList.add("centerClass");
                    buttonToCatch.addEventListener(eventToCatch, function(e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        if (timeouts.running) {
                            timeouts.running.forEach(function(timeout) {
                                clearTimeout(timeout);
                                timeouts.cleared.push(timeout);
                            });
                            timeouts.running = [];
                        }
                        let id = e.srcElement.id.split('_');
                        timeouts.running.push(setTimeout(function() {
                            addToAnki(e, id[1], id[2]);
                        }, maxIntervalClick));
                    });
                    i++;
                });
                allQcms[q] = {
                    qcms: qcms, enonce: enonce, qcmNumber: qcmNumber, qcmBlock: qcmBlock
                };
            })
        }
        window.addButton = addButton;
        //$('.serie :submit').off('click', correctionSerie);
        //addButton();

        window.invoke = function(data) {
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

                xhr.open('POST',
                    'http://127.0.0.1:8765');
                xhr.send(JSON.stringify(data));
            });
        }
        var addRule = (function (style) {
            var sheet = document.head.appendChild(style).sheet;
            return function (selector,
                css) {
                var propText = typeof css === "string" ? css: Object.keys(css).map(function (p) {
                    return p + ":" + (p === "content" ? "'" + css[p] + "'": css[p]);
                }).join(";");
                sheet.insertRule(selector + "{" + propText + "}",
                    sheet.cssRules.length);
            };
        })(document.createElement("style"));

        addRule(".ligneTitre:before", {
            "position": "absolute !important",
            "left": "10px ! important"
        })
    }
})();