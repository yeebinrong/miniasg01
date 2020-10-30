// load libraries
const express = require('express')
const handlebars = require('express-handlebars')
const fetch = require('node-fetch')
const withQuery = require('with-query').default

// create an instance of express
const app = express()

// configure handlebars
app.engine('hbs', 
    handlebars({defaultLayout: 'template.hbs'})) 
app.set('view engine', 'hbs')

// declare variables
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
const ENDPOINT = 'https://newsapi.org/v2/top-headlines'
const API_KEY = process.env.NEWSAPI || ""

const images = 
    [
        'cn', 
        'fr', 
        'jp', 
        'sg', 
        'uk', 
        'us'
    ]

const categories = 
    [
        'Business', 
        'Entertainment', 
        'General', 
        'Health', 
        'Science', 
        'Sports', 
        'Technology'
    ]

const cache = []

// #GET routes
app.get('/', (req, resp) => { 
    resp.status(200)
    resp.type('text/html')
    resp.render('home',
        {
            title: 'Home',
            images,
            categories,
            state: 0 // not yet search
        }
    )
})

app.get('/results', 
    async (req, resp) => {    
        const search = req.query['search']
        const category = req.query['category']
        const country = (req.query['country']).toUpperCase()
        
        try {
            // attempts to get data from NEWS API
            const results = await getNews(search, category, country, API_KEY)
            const articles = results.articles
            
            for (article of articles)
            {
                article['default'] = req.query['country']
                article['publishedAt'] = new Date (article.publishedAt)
            }

            // title
            // description
            // urlToImage
            // publishedAt 
            // url

            resp.status(201)
            resp.type('text/html')
            resp.render('home',
                {
                    title: `News from ${country}`,
                    country,
                    category,
                    search,
                    images,
                    categories,
                    articles,
                    state: 1 // searched
                }
            )
        }
        catch (e) {
            console.info('results error: ', e)
        }
    }
)

// #load resources
app.use(express.static(`${__dirname}/static`))

// #POST routes
// ## NOT USING ##

// redirect back to homepage if random entry
app.use((req, resp) => {
    resp.status(301)
    resp.type('text/html')
    resp.redirect('/')
})

// functions
const getNews = async (search, category, country, API_KEY) => {
    // use withquery to generate url
    const URL = withQuery(
        ENDPOINT,
        {
            q: search,
            //apiKey: API_KEY, // use x-api key instead of this for security
            country: country,
            category
        }
    )

    // cache check
    if (cache.URL)
    {
        console.info(`cache retrieved at ${new Date()}`)
        return Promise.resolve(cache.URL)
    }
    // if not retrieve data from api
    else
    {
        try {
            // attempts to fetch data from url
            const results = await fetch(URL, {
                method: 'GET',
                headers: {
                    'X-API-KEY': API_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                //body: JSON.stringify(callData)
            })
    
            if (results.status == 200) 
            {
                const dataArray = await results.json()
                // cache the data
                cache.URL = dataArray
                return Promise.resolve(dataArray)
            }
            else
            {
                // if data is !OK
                return Promise.reject(results.statusText)
            }
        }
        catch (e) {
            console.info('fetch error: ', e)
            return Promise.reject(e)
        }
    }
}

// listen for port
app.listen(PORT , () => {
    console.info(`Application is listening PORT ${PORT} at ${new Date()}.`)
})