// ==UserScript==
// @name         AnkiWeb fetch OP
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Simple adding deepLinking from OP using Userscript
// @updateURL    https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/ankiwebFetchOp.user.js
// @downloadURL  https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/ankiwebFetchOp.user.js
// @author       Jonas Cohen
// @match        https://ankiuser.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ankiuser.net
// @grant        none
// ==/UserScript==


(function() {
    'use strict';
    if (window.location.pathname.includes('add')) {
        // Fonction pour manipuler les champs du formulaire une fois qu'ils ont été ajoutés
        var urlParams = new URLSearchParams(window.location.hash.substring(1));
        function getDataFromUrlKey(key) {
            var data = key == 'deck' ? "Pass::Erreurs OP::UE12": "";
            if (urlParams.has(key)) {
                data = urlParams.get(key);
            }
            return data;
        }
        function manipulateFields() {
            // Sélectionne les éléments du formulaire
            const recto = document.querySelector("body > div > main > form > div:nth-child(1) > div > div");
            const deckSelect = document.querySelector("body > div > main > div.form-group.row.mt-2.mb-4 > div > div")
            const verso = document.querySelector("body > div > main > form > div:nth-child(2) > div > div");
            const tags = document.querySelector("body > div > main > form > div:nth-child(3) > div > input");


            // Manipule les champs
            recto.innerHTML = getDataFromUrlKey("recto");
            recto.dispatchEvent(new Event('input'));

            verso.innerHTML = getDataFromUrlKey("verso");;
            verso.dispatchEvent(new Event('input'));

            tags.value = getDataFromUrlKey("tags");;
            tags.dispatchEvent(new Event('input'));

            deckSelect.dispatchEvent(new Event('pointerup'))
            // Supposons que UE contient la valeur de l'unité d'enseignement, par exemple 'UE10'
            var deck = getDataFromUrlKey("deck")

            // Sélectionnez le div correspondant en utilisant la méthode querySelector()


            // Crée un observer pour détecter les modifications dans le DOM
            const observerOptions = new MutationObserver((mutationsList, observer) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // Vérifie si l'élément spécifié est présent
                        window.selectListItems = document.querySelectorAll('.svelte-select-list .item.svelte-apvs86');
                        if (selectListItems.length > 0) {
                            var deckOption = Array.from(selectListItems)
                            .find(el => el.textContent === deck);
                            // Vérifiez si le div correspondant a été trouvé
                            if (deckOption) {
                                // Faites quelque chose avec le div trouvé
                                deckOption.click();
                                observer.disconnect();
                            }
                        }
                        break;
                    }
                }
            });
            observerOptions.observe(deckSelect,
                {
                    childList: true,
                    subtree: true
                });

        }

        // Crée un observer pour détecter les modifications dans le DOM
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Vérifie si les éléments du formulaire ont été ajoutés
                    if (document.querySelector("body > div > main > form > div:nth-child(1) > div > div") &&
                        document.querySelector("body > div > main > form > div:nth-child(2) > div > div") &&
                        document.querySelector("body > div > main > form > div:nth-child(3) > div > input")) {
                        // Si tous les éléments sont présents, arrête d'observer les mutations
                        observer.disconnect();
                        // Manipule les champs du formulaire
                        manipulateFields();
                        break;
                    }
                }
            }
        });

        // Configure l'observer pour écouter les modifications dans le corps de la page
        observer.observe(document.body,
            {
                childList: true,
                subtree: true
            });
    } else if (window.location.pathname.includes('study')) {
        let styleTag = document.createElement("style");
        styleTag.innerHTML = "#tagContener { position: initial !important;}";
        document.body.appendChild(styleTag);
        // Crée un observer pour détecter les modifications dans le DOM et voir si le script est ajouté
        // Fonction à appeler lorsque la mutation est détectée
        window.nodes = [];
        function handleMutation(mutationsList, observer) {
            mutationsList.forEach(mutation => {
                // Vérifier si un nœud a été ajouté
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // Vérifier si le nœud ajouté est une balise script
                        if (node.tagName && node.tagName.toLowerCase() === 'script') {
                            // Vérifier si la fonction openLink est définie dans le script
                            if (node.text.includes("openLink")) {
                                if (!window.changesAlreadyDone) {
                                    nodes.push(node);
                                    console.log(node);
                                    // Créer une nouvelle balise script
                                    var newScript = document.createElement('script');

                                    // Définir le contenu du script
                                    window.scriptContent = `
                                    window.changesAlreadyDone = true;
                                    function initButtons() {
                                    if(!document.querySelector('.tags a.new-tag')){
                                    var tagElement = document.querySelector('.tags');
                                    var tags = tagElement.innerHTML.split(' ');
                                    var html = '<a onclick="ct_dblclick('+"'*', 'Pass::Erreurs OP::UE12'"+')" class="new-tag">Pass::Erreurs OP::UE12</a>';
                                    tags.forEach(function(tag) {
                                    if(tag.startsWith("z_")) {
                                    var newTag = '<a onclick="qcmTagHandler(event, ' + "'" + tag + "'" + ')" class="new-tag">' + tag + '</a>';
                                    html += newTag;
                                    } else {
                                    var newTag = '<a onclick="ct_click(' + "'" + tag + "'" + ')" ondblclick="ct_dblclick(' + "'" + tag + "', 'Pass::Erreurs OP::UE12'"+ ')" class="new-tag">' + tag + '</a>';
                                    html += newTag;
                                    }
                                    });
                                    tagElement.innerHTML = html;
                                    }}


                                    function qcmTagHandler(event, tag) {
                                    if(event.ctrlKey) {
                                    //pycmd("ct_click_" + tag)
                                    ct_click(tag);
                                    } else {
                                    var url = 'https://www.objectifpass.fr/qcm/affiche-' + tag.slice(2);
                                    openNewLink(url);
                                    }
                                    }

                                    function openNewLink(link) {
                                    var aToDisplay = document.createElement("a");
                                    aToDisplay.target = "_blank";
                                    aToDisplay.href = link;
                                    aToDisplay.click();
                                    }

                                    `;

                                    // Ajouter la nouvelle balise script au document
                                    newScript.textContent = window.scriptContent;
                                    document.getElementById("qa").prepend(newScript);
                                    console.log("changed");
                                    initButtons();
                                } else {
                                    initButtons();
                                }
                            }
                        }
                    });
                }
            });
        }

        // Configurer le MutationObserver
        var observer = new MutationObserver(handleMutation);

        // Commencer à observer les mutations dans le nœud du document
        observer.observe(document, {
            childList: true, subtree: true
        });

    }
})();
const tagEl = "";