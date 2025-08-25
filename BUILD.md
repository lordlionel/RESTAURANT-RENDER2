# Instructions de Déploiement Netlify

## Étapes pour déployer sur Netlify

### 1. Prérequis
- Compte Netlify
- Base de données PostgreSQL (Neon recommandé)
- Variables d'environnement DATABASE_URL configurée

### 2. Configuration Netlify
Le fichier `netlify.toml` est déjà configuré avec :
- Build command: `npm run build`  
- Publish directory: `dist`
- Redirections pour l'API et le SPA

### 3. Variables d'environnement
Configurer dans Netlify (Site Settings > Environment Variables) :
```
DATABASE_URL=votre_url_postgresql
NODE_ENV=production
```

### 4. Déploiement
1. Connecter votre repository à Netlify
2. Les builds se lanceront automatiquement sur chaque push
3. L'application sera accessible via l'URL Netlify

## Synchronisation des données

✅ **La synchronisation est déjà activée**
- L'application utilise PostgreSQL distant (Neon)
- Toutes les données sont synchronisées automatiquement
- Accès depuis n'importe quel appareil après connexion

## État actuel
✅ Base de données nettoyée (historique de test effacé)  
✅ 254 consommateurs préservés  
✅ Configuration Netlify prête  
✅ Synchronisation des données active