const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'moviesData.db')
let database = null

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

const convertMovieDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDirectorDbObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
  SELECT movie_name
  FROM movie;`

  const movieArray = await database.all(getMoviesQuery)
  response.send(
    movieArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      movie 
    WHERE 
      movie_id = ${movieId};`
  const movie = await database.get(getMovieQuery)
  response.send(convertMovieDbObjectToResponseObject(movie))
})

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const postSqlQuery = `
  INSERT INTO
  movie (director_id,movie_name,lead_actor)
  VALUES
  (
    ${directorId},
    '${movieName}',
    '${leadActor}'
  );`
  await database.run(postSqlQuery)

  response.send('Movie Successfully Added')
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const putSqlQuery = `
      UPDATE
        movie
      SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
      WHERE
        movie_id=${movieId};`
  await database.run(putSqlQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteSqlQuery = `
      DELETE FROM
        movie
      WHERE
        movie_id= ${movieId};`
  await database.run(deleteSqlQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director;`
  const directorsArray = await database.all(getDirectorsQuery)
  response.send(
    directorsArray.map(eachDirector =>
      convertDirectorDbObjectToResponseObject(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`
  const moviesArray = await database.all(getDirectorMoviesQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})
module.exports = app
