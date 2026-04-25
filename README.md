# INF8808 - Visualisation des Jeux Olympiques

## Description

Ce projet présente une exploration visuelle de l’inclusion mondiale aux Jeux Olympiques de 1896 à 2024 à l’aide de **D3.js**.  
L’application est construite comme un **site web statique** en **HTML / CSS / JavaScript (ES modules)**, sans framework.

Le prétraitement des données est exécuté **entièrement dans le navigateur** à partir de **8 fichiers CSV bruts** provenant de jeux de données Kaggle.  
Aucun fichier de données pré-nettoyé n’est requis.

**Vidéo explicative des visualisations:** https://youtu.be/HJZDmcgEqNw

## Objectif du projet

Le projet repose sur trois visualisations principales :

- **Viz 1** : analyse des médailles
- **Viz 2** : analyse de la participation des athlètes
- **Viz 3** : analyse croisée selon les besoins de l’équipe

L’architecture a été pensée pour séparer :

- le **chargement et nettoyage** des données
- le **prétraitement spécifique** à chaque visualisation
- le **rendu D3.js**
- la **navigation** et les **filtres**

## Structure du projet

```text
racine/
├── package.json
├── README.md
└── src/
    ├── index.html
    ├── index.js
    ├── assets/
    │   ├── styles/
    │   ├── data/
    │   │   └── raw/
    │   └── fonts/
    └── scripts/
        ├── config.js
        ├── helper.js
        ├── preprocess.js
        ├── navigation.js
        ├── filters.js
        ├── viz1/
        ├── viz2/
        └── viz3/
```

## Prérequis

Avant d’exécuter le projet, assure-toi d’avoir :

- **Node.js** installé
- **npm** installé
- un navigateur moderne, idéalement **Google Chrome**

## Installation

1. Cloner ou télécharger le projet
2. Installer les dépendances :

```bash
npm install
```

## Données requises

Les fichiers CSV bruts doivent être placés dans le dossier suivant :

```text
src/assets/data/raw/
```

Fichiers attendus :

- `olympic_medals.csv`
- `olympic_hosts.csv`
- `olympic_results.csv`
- `olympic_athletes.csv`
- `medals.csv`
- `medallists.csv`
- `athletes.csv`
- `nocs.csv`

Le projet est conçu pour fonctionner directement dès que ces fichiers sont présents à cet emplacement.

## Lancer le projet

Démarrer le serveur local :

```bash
npm start
```

Ensuite, ouvrir dans le navigateur l’URL affichée dans le terminal.

## Fonctionnement général

Au lancement :

1. les 8 fichiers CSV sont chargés avec `d3.csv()`
2. le module `preprocess.js` nettoie et fusionne les données
3. les données sont redistribuées vers les modules de prétraitement par visualisation
4. les visualisations sont initialisées dans l’interface

## Export CSV pour les tests

Le projet inclut un mécanisme d’export CSV par visualisation afin de valider le prétraitement.

Cela permet de :

- vérifier les transformations réalisées
- inspecter les données finales utilisées par chaque viz
- comparer les sorties attendues et réelles pendant le développement

## Scripts disponibles

```bash
npm start
```

Lance un serveur statique local pour exécuter l’application dans le navigateur.

## Technologies utilisées

- **D3.js**
- **JavaScript ES modules**
- **HTML5**
- **CSS3**
- **npm**

## Remarques

- Aucun backend n’est nécessaire
- Aucun build complexe n’est requis
- Le traitement des données se fait côté client
- Le projet est prévu pour un contexte académique / démonstratif

## Auteur

Projet réalisé dans le cadre du cours **INF8808 – Visualisation de données**.
