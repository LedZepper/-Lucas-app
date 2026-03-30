# 📚 École de Léo

App de suivi scolaire CE1 — génération d'exercices personnalisés avec Claude AI.

## Stack
- React + Vite
- Supabase (base de données partagée entre parents)
- Claude API (génération d'exercices)
- Vercel (hébergement)

## Déploiement

### 1. Variables d'environnement (Vercel)
Ajouter dans les settings Vercel :
```
VITE_SUPABASE_URL=https://enppydwndwwbmnueuuup.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt
```

### 2. Clé API Anthropic
La clé API Anthropic est saisie directement dans l'interface et sauvegardée localement sur chaque appareil (localStorage). Chaque parent entre sa propre clé.

## Structure
```
src/
  App.jsx       — composant principal
  supabase.js   — client Supabase + fonctions CRUD
  main.jsx      — point d'entrée React
```
