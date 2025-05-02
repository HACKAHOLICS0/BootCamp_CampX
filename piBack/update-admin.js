// Script pour mettre à jour l'utilisateur admin
db = db.getSiblingDB('HACKAHOLICS');
db.users.updateOne(
  { email: 'admin@campx.com' },
  { $set: { isVerified: true, state: 1 } }
);
