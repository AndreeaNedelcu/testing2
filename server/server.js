const  express =require('express')
const bodyParser=require('body-parser')
const Sequelize=require('sequelize');
const cors=require('cors');
const { appendFile } = require('fs');
let countPagination=0
let limit=2


const sequelize=new Sequelize({
    dialect: 'sqlite',
    storage: './sqlite/sample.db',
    define:{
        timestamps:false
    }
})


const Movie=sequelize.define('movie', {

    id: {
    type: Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoincrement: true
  },
  title:{
      type:Sequelize.DataTypes.STRING,
      validate: {
        len: [3, 100]
      }
  },
  category:{
      type:Sequelize.DataTypes.ENUM('horror', 'action', 'sf')
  },
  date:{
      type:Sequelize.DataTypes.DATE,
      validate: {
       isDate:true
      }
  }
})

const CrewMember=sequelize.define('crewmember', {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoincrement: true
      },
      name:{
          type: Sequelize.DataTypes.STRING,
          validate: {
              len: [5,100]
          }
      },
      role:{
          type:Sequelize.DataTypes.ENUM("director", "writer")

      }
      
})


 Movie.hasMany(CrewMember)

const app=express()
app.use(cors())
app.use(bodyParser.json());

app.get('/sync', async(req, res)=>{
    try{
        await sequelize.sync({force:true})

        res.status(201).json({message:'Tables created'})
    }
    catch(err){
        console.warn(err);
        res.status(500).json({message: 'some error'})
    }
})
app.get("/categories", async (req, res) => {
    try {
      res.status(205).json(Movie.rawAttributes.category.values);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });

//-------------- MOVIE------------------
//filtrare pe category
app.get("/moviesCategoryFilter/:category", async (req, res) => {
    try {
      const movies = await Movie.findAll({
        where: { category: req.params.category },
      });
  
      res.status(200).json(movies);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });

//   //filtrare pe title
app.get("/moviesFilter/:title", async (req, res) => {
    
    try {
      const movies = await Movie.findAll({
        where: { title: req.params.title },
      });
  
      res.status(200).json(movies);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });


 // sort alfabetic pe title
//   app.get("/moviesSorted", async (req, res) => {
    
//     try {
//       const movies = await Movie.findAll({
//           order:[['title', 'ASC']]
    
//       }).then((movies)=>{
//         res.status(200).json(movies);
//       })

  
      
//     } catch (err) {
//       console.warn(err);
//       res.status(500).json({ message: "some error" });
//     }
//   });

app.get("/moviesSort", async (req, res) => {
    try {
      const movies = await Movie.findAll({});
      const moviesSorted = movies.sort((e, i) => e.title.localeCompare(i.title));
      console.log(moviesSorted);
      res.status(200).json(moviesSorted);
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });


  //PAGINATION
  app.get("/moviesPagination", async (req, res) => {
    try {
      Movie.findAndCountAll({
        // where: { category: req.params.category },
  
        limit: limit,
        offset: countPagination,
      }).then(function (result) {
        res.status(202).json(result.rows);
        countPagination += limit;
      });
    } catch (err) {
      console.warn(err);
      res.status(500).json({ message: "some error" });
    }
  });

  //CRUD

app.get('/movies', async(req, res)=>{
    try{
       const movies=await Movie.findAll({
       })
       console.log(movies)
       res.status(200).json(movies)
    }
    catch(err){
        console.warn(err);
        res.status(500).json({message: 'some error'})
    }
})




app.post('/movies', async(req, res)=>{
    try{
      await Movie.create(req.body)
      res.status(201).json({message:'created'})
    }
    catch(err){
        console.warn(err);
        res.status(500).json({message: 'some error'})
    }
})
app.get('/movies/:id', async(req, res)=>{
    try{
    const movie=await Movie.findByPk(req.params.id)
    if(movie){
        res.status(200).json(movie)
    }
    else{
        res.status(404).json({message:'not found'})
    }

 }
 catch(err){
     console.warn(err);
     res.status(500).json({message: 'some error'})
 }
}) 

app.put('/movies/:id', async(req, res)=>{ 
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){
            await movie.update(req.body, {fields:['title', 'category','date']})
            res.status(202).json({message:'accepted'})
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})
app.delete('/movies/:id', async(req, res)=>{
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){
            await movie.destroy()
            res.status(202).json({message:'accepted'})
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})

//---------------------- crew member-------------------------



app.get('/movies/:id/crewmembers', async(req, res)=>{
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){
            const crewmembers=await movie.getCrewmembers()

            res.status(200).json(crewmembers)
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})

app.post('/movies/:id/crewmembers', async(req, res)=>{
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){

            const crewmember=req.body
            crewmember.movieId=movie.id
            await CrewMember.create(crewmember)

            res.status(201).json({message:'created'})
        }
        else{
            res.status(404).json({message:'not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})

app.get('/movies/:id/crewmembers/:cid', async(req, res)=>{
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){
            const crewmembers=await movie.getCrewmembers({where:{id:req.params.cid}})
            const crewmember=crewmembers.shift();
            if(crewmember){
                res.status(200).json(crewmember)
            }
            else{
                res.status(404).json({message:' crewmember not found'})
            }

            res.status(200).json(crewmembers)
        }
        else{
            res.status(404).json({message:' movie not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})
app.put('/movies/:id/crewmembers/:cid', async(req, res)=>{
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){
            const crewmembers=await movie.getCrewmembers({where:{id:req.params.cid}})
            const crewmember=crewmembers.shift();
            if(crewmember){
                await crewmember.update(req.body)
                res.status(202).json({message:'accepted'})
            }
            else{
                res.status(404).json({message:' crewmember not found'})
            }

            res.status(200).json(crewmembers)
        }
        else{
            res.status(404).json({message:' movie not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})
app.delete('/movies/:id/crewmembers/:cid', async(req, res)=>{
    try{
        const movie=await Movie.findByPk(req.params.id)
        if(movie){
            const crewmembers=await movie.getCrewmembers({where:{id:req.params.cid}})
            const crewmember=crewmembers.shift();
            if(crewmember){
                await crewmember.destroy()
                res.status(202).json({message:'accepted'})
            }
            else{
                res.status(404).json({message:' crewmember not found'})
            }

            res.status(200).json(crewmembers)
        }
        else{
            res.status(404).json({message:' movie not found'})
        }
    
     }
     catch(err){
         console.warn(err);
         res.status(500).json({message: 'some error'})
     }
})


app.listen(8080)