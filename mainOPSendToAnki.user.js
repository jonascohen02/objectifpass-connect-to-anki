// ==UserScript==
// @name          Main OP Connect To Anki
// @namespace     http://tampermonkey.net/
// @version       2.8
// @updateURL     https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/mainOPSendToAnki.user.js
// @downloadURL   https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/mainOPSendToAnki.user.js
// @description   Adding buttons on OP to redirect to Anki and other cool tools
// @author        Jonas Cohen
// @match         https://www.objectifpass.fr/*
// @exclude-match https://www.objectifpass.fr/entrainement/exam_corrige*
// @icon          https://www.google.com/s2/favicons?sz=64&domain=objectifpass.fr
// @grant         none
// ==/UserScript==

(function() {
    'use strict';
    //Personaliser qcm affiche pour ne pas afficher directement les réponses
    if (window.location.pathname.includes('qcm/affiche')) {
        var toggle = 0,
        innerOriginal;
        window.addEventListener("load", function() {
            innerOriginal = structuredClone(document.querySelector('.QCM_block').innerHTML);
            toggleSerieCorrectionAlwreadyDone(true);
            $('.QCM_question').css('cursor', 'pointer').on('click', toggleSerieCorrectionAlwreadyDone);
        });
        function toggleSerieCorrectionAlwreadyDone(firstTime) {
            var elementToOuter = document.querySelectorAll('.QCM_reponse');
            var button = '<a class="QCM_reponse switch icons"><span class="ss-on" style="display: none;"></span><span class="ss-slider" style="left: 0px;"></span></a>';
            if (firstTime) {
                elementToOuter.forEach(function(e) {
                    e.classList.add('answerItem')
                });
                elementToOuter.forEach(function(e) {
                    e.classList.toggle('notDisplay')
                });
                elementToOuter.forEach(function(e) {
                    e.insertAdjacentHTML('beforebegin', '<a class="QCM_reponse switch icons ss_alreadyOn"><span class="ss-on" style="display: none;"></span><span class="ss-slider" style="left: 0px;"></span></a>');
                });
                toogleExplicationOnLoad()
            } else {
                toogleExplication()
            };
            if (!toggle) {} else {
                document.querySelector('.QCM_block').innerHTML = innerOriginal;
                document.querySelectorAll('.QCM_ligne_explication .bouton_bleu').forEach(function(element) {
                    element.remove();
                });
                addButton();
                $('.QCM_question').css('cursor', 'pointer').on('click', toggleSerieCorrectionAlwreadyDone)
            }
            toggle = toggle == 0 ? 1: 0;
        }
    }
    if (!window.location.pathname.includes('entrainement/exam_corrige')) {
        //AJOUTER LES BOUTONS ET TOUTES LES FONCTIONS DE RECUPERATION DE DONNEES
        //A EXECUTER SUR TOUS LES SITES OBJECTIF PASS
        let styleTag = document.createElement("style");
        styleTag.innerHTML = ".centerClass { text-align: center; } .notDisplay{ display:none ! important;}";
        document.head.appendChild(styleTag);
        var qcms = {};
        var timeouts = {
            running: [],
            cleared: []},
        sync1 = 0,
        sync2 = 0,
        qcmNumber,
        ue,
        enonce,
        annaleTag;
        //VARIABLES SYNC PERMETTENT DE VOIR SI LE CLICK SUR LE QCMBLOCK QUI TOGGLE LA CORRECTION COINCIDE AVEC UN CLICK SUR UN BOUTON CONTENU A L'INTERIEUR ET DONC ADDTOANKI AUQUEL CAS IL FAUT EMPECHER LE TOGGLE DE FAIRE CELA CAR JE VEUX CONSERVER LE CLICK SUR TOUT LE QCM BLOCK
        const UeDefault = 12,
        mobile = navigator.userAgentData ? navigator.userAgentData.mobile: true,
        maxIntervalClick = 200;
        //var correctionSerie = $._data($('.serie :submit')[0], 'events').click[0].handler;

        window.addToAnki = function(e, i) {
            sync1++;
            //ON DESYNCHRONISE sync1 et sync2  ON REAJUSTERA sync2 A LA FIN DU TOOGLE

            //COMPTE LE NOMBRE DE TIMEOUTS CLEARED ENTRE PLUSIEURS CLICK SI L'INTERVALLE ENTRE DEUX CLICK EST TOUJOURS + PETIT QIE 200ms (maxIntervalClick)
            e.nbClick = timeouts.cleared.length + 1;
            console.log(e.nbClick);
            timeouts.cleared = [];
            timeouts.running = [];
            var qcm = qcms[i];
            var recto = qcm.qst,
            verso = qcm.answ,
            simulateMobile = mobile,
            dataToAdd = {
                "action": "multi",
                "params": {
                    "actions": []
                }
            }
            if (e.altKey) {
                simulateMobile = true;
            }
            if (e.ctrlKey || e.nbClick >= 3) {
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
            if ((e.shiftKey && e.ctrlKey) || e.nbClick >= 3) {
                recto = enonce.replace(/\(Annales ([0-9]{4})\/([0-9]{4})\)/g, '') + " " + recto;
            } else if (e.shiftKey || e.nbClick == 2) {
                recto = enonce.replace(/\(Annales ([0-9]{4})\/([0-9]{4})\)/g, '') + " <br>" + recto;
            };
            var dataEnonceImg = "",
            dataCorrectionImg = "";
            if (!simulateMobile) {
                var enonceImg = document.querySelector('img.enonce'),
                correctionImg = document.querySelector('img.correction');

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
                tags: "p_OP" + " " + getAnnaleTag() + " " + "type_Erreur" + " " + "z_" + qcmNumber + " " + "UE" + ue + "_"
            };
            const searchParams = new URLSearchParams(data);
            if (e.nbClick >= 4) {
                navigator.clipboard.writeText("https://ankiuser.net/add#?" + searchParams.toString());
            }
            //Si MOBILE OU SI TOUCHE ALT ON OUVRE DANS LE NAVIGATEUR SINON DANS L'APPLICATION !
            if (simulateMobile) {
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

        function getAnnaleTag() {
            enonce = getEnonce();
            var chaineRegex = "\\(Annales ([0-9]{4})\/([0-9]{4})\\)";
            var regex = new RegExp(chaineRegex);
            var regexResult = regex.exec(enonce);
            annaleTag = regexResult == undefined ? "": "y_annale_" + regexResult[1] + "-" + regexResult[2];
            return annaleTag;
        }

        function getQcmNumber() {
            var openFormElement = document.querySelector('#threadOpenForm div.text')
            var openForm = openFormElement == undefined ? "": openFormElement.innerText;
            var chaineRegex = "Poser une question sur le QCM ([0-9]*) \\?";
            var regex = new RegExp(chaineRegex);
            var regexResult = regex.exec(openForm);
            qcmNumber = regexResult == undefined ? "9999": regexResult[1];
            return qcmNumber;
        }

        function getUe() {
            var completeUeElement = document.querySelector('#sidebar p');
            var completeUe = completeUeElement == undefined ? "": completeUeElement.innerText;
            var chaineRegex = "UE( spé )?([0-9]+)";
            var regex = new RegExp(chaineRegex);
            var regexResult = regex.exec(completeUe);
            ue = regexResult == undefined ? UeDefault: regexResult[2];
            return ue;
        }

        function getEnonce() {
            var completeEnonceElement = document.querySelector('.QCM_enonce');
            enonce = completeEnonceElement == undefined ? "Enonce Nulle": completeEnonceElement.innerText.trim();
            return enonce + "<br>";
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
                buttonToCatch.id = 'addToAnki_' + i;
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
                    let id = e.srcElement.id.replace('addToAnki_', '');
                    timeouts.running.push(setTimeout(function() {
                        addToAnki(e, id)
                    }, maxIntervalClick));
                });
                i++;
            })
            try {
                $._data($('.serie .QCM_block').css('cursor',
                    'pointer')[0],
                    'events').click[0].handler = toogleCorrection
            } catch {
                return false
            };
        }
        window.addButton = addButton;
        //$('.serie :submit').off('click', correctionSerie);
        //addButton();
        $('.serie :submit').on('click', addButton);
        $(document).on('ajaxPageLoad',
            function(event) {
                $('.serie :submit').on('click',
                    addButton);
            }
        );

        function toogleCorrection(element = this,
            isAll = false,
            toggleTime = 150) {
            element = $('.QCM_block');
            //PAS DE CLICK SUR LE BOUTON ADDTOANI
            if (sync1 == sync2) {
                var $explication = $(element).find('.QCM_ligne_explication');
                window.element = element;
                console.log(window.element);
                var nb_max = $explication.length; // généralement 5, mais 6 pour Montpellier avec l'item F
                for (var i = 0; i < nb_max; i++) {
                    if ($explication.eq(i).hasClass('juste') || isAll) {
                        //if(true) {
                        $explication.eq(i).toggle(toggleTime);
                    }
                }
                /* re-calcul les formules de math qui étaient cachées  */
                $explication.each(function() {
                    MathJax.Hub.Queue(["Rerender", MathJax.Hub, this]);
                })
            } else {
                sync2++;
            }

        }
        window.toogleExplication = function() {
            toogleCorrection($('.QCM_block'), true)
        };
        window.toogleExplicationOnLoad = function() {
            toogleCorrection($('.QCM_block'), true, 0)
        };

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