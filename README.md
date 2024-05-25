# objectifpass-connect-to-anki
## Utilisation:
Ce userscript permet de connecter ObjectifPass à Anki afin d'importer très facilement vos erreurs et de pouvoir les revoir afin de ne plus les faire. Il inclut également un système de Tag détaillé plus tard.
Sa principale fonction est d'ajouter un bouton sous chaque item qui apparaissent en même temps que la correction. 
L'installation est détaillé plus loin.

![image](https://github.com/jonascohen02/objectifpass-connect-to-anki/assets/83279036/ea48d61c-1797-44ca-9ff1-2865a4ab89d8)


Lorsque l'on clique sur ce bouton, on est redirigé soit:
- vers l'application (sur ordinateur)
- ou bien sur le site web "Ankiweb" (sur mobile ou bien en restant appuyé sur la touche alt en même temps que le clic sur ordinateur).


Cela va ouvrir la fenêtre d'ajout de carte d'anki et va automatiquement remplir tous les champs de la carte. Vous n'aurez plus qu'à ajouter des éléments ou bien valider l'ajout de la carte:
![image](https://github.com/jonascohen02/objectifpass-connect-to-anki/assets/83279036/327c57df-39d5-4d56-bc02-0084013a633c)

Dans les tags, on retrouve le numéro du QCM (précédé par z_) qui permettra de retrouver le qcm et de regarder les discussions plus tard. On retrouve également l'année de l'annale si le qcm provient d'une annale (précédé par y_). On a également la plateforme précédé de p_, ici OP pour ObjectifPass ainsi que le type d'erreur: cela pourrait être type_Erreur(par défaut, lorsque vous avez oublié la réponse) mais vous pouvez le modifier par type_PasDaccord, type_PasCompris... l'intérêt est ici de classifier les différents éléments que vous ajoutez sur Anki pour pouvoir les retrouver plus facilement plus tard et vérifier que la connaissance est acquise. Enfin , on retrouve l'UE suivi d'un _ ou vous pouvez ensuite ajouter le nom du cours de l'UE. Exemple: UE12_Myologie

En cliquant une fois sur le bouton, on ajoute uniquement l'item, en cliquant 2 fois on ajoute l'item ainsi que l'énoncé dans le recto. Enfin en cliquant 3 fois d'affilé sur un bouton, on ajoute tout les items du qcm (vrai comme faux) sur le recto ainsi que toutes les réponses au verso.

Illustration:
Appuyer 1 fois:  
![image](https://github.com/jonascohen02/objectifpass-connect-to-anki/assets/83279036/950cfae1-3cb3-493e-9fc6-6df318859785)

Appuyer 2 fois:

![image](https://github.com/jonascohen02/objectifpass-connect-to-anki/assets/83279036/7f951d5f-2beb-459f-b0e0-22e807f0027e)

Appuyer 3 fois: 
![image](https://github.com/jonascohen02/objectifpass-connect-to-anki/assets/83279036/97ff5216-9434-4814-862e-02d53e663b1f)

## Installation
Pour installer cet outil (aussi disponnible sur IOS/Androïd) vous aurez besoin d'installer une extension sur votre navigateur qui supporte l'outil.
- Sur Windows ou Macos, la plus connue et celle que je recommande se nomme Tampermonkey ([Chrome](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo) 
 [Microsoft Edge](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd)  [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) [Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089))
- Sur IOS, il faudra télécharger l'application [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887). Il ne faudra pas oublier de l'activer ensuite dans Réglages > Safari > Extensions > Userscripts > Autoriser l'extension
- Sur Android il faudra être sur le navigateur Firefox et installer tampermonkey (Malheureusement, Chrome ne prend pas en charge les extensions).


Une fois que l'extension est installé, rendez vous sur ce lien: [https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/mainOPSendToAnki.user.js](https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/mainOPSendToAnki.user.js).

Puis cliquer sur installer. Et voilà vous venez d'ajouter l'outil sur Objectif Pass.

Il faudra également ajouter l'outil sur site web d'Anki (Ankiweb) en allant sur ce lien : [https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/ankiwebFetchOp.user.js](https://github.com/jonascohen02/objectifpass-connect-to-anki/raw/main/ankiwebFetchOp.user.js)
Et en cliquant sur installer. Celui-ci permettra de récupérer les informations sur ankiweb


Enfin uniquement sur ordinateur, si vous souhaitez que la fenêtre s'ouvre dans l'application Anki est non unquement dans l'application web, il faudra télécharger le greffon/plugin sur Anki nommé [AnkiConnect](https://ankiweb.net/shared/info/2055492159). 

Pour cela: rendez vous sur `Anki` > `Outil` > `Greffons` > `Acquérir des Greffons`. Puis entrez ce code: `2055492159` et cliquer sur 'OK'
Enfin, toujours sur la page des greffons (addons en Anglais) séléctionner Ankiconnect et cliquer sur configuration.
Remplacer la configuration actuelle par
```
{
    "apiKey": null,
    "apiLogPath": null,
    "ignoreOriginList": [],
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": [
        "http://localhost",
        "https://www.objectifpass.fr"
    ]
}
```

Cliquer 'OK'.
Et voilà !! il ne vous reste plus qu'à fermer Anki et à le rouvrir et tout devrait être totalement fonctionnel !
