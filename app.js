
const express = require('express');         
const cors = require('cors');               
const app = express();                                               

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Rutas básicas                            
app.get('/', (req, res) => {                
  res.json({ message: 'Welcome to the Wolf-Goat-Cabbage game backend!' });  
})    
                                            
// Importar rutas de usuarios               
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);          

const gamesRoutes = require('./routes/games');
app.use('/api/games', gamesRoutes);          
                
app.get('/api/testing', (req, res) => {
  res.status(200).json({ message: 'API is working correctly' });
});
// Configuración del puerto                 
const PORT = process.env.PORT || 4000;      
app.listen(PORT, () => {                    
  console.log(`Server running on port ${PORT}`);
});
