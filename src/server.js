import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient, ServerApiVersion } from 'mongodb';
import path from 'path';

// const articlesInfo = {
//     "learn-react" : { upvotes: 0, comments: [], },
//     "learn-node" : { upvotes: 0, comments: [], },
//     "my-thoughts-on-resumes" : { upvotes: 0, comments: [], },
// }

const app = express();

app.use(express.static(path.join(__dirname, '/build')))
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    const uri = 'mongodb+srv://admin:Systie267@devcamper.mdih4.mongodb.net/?retryWrites=true&w=majority';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        const db = client.db('my-blog');
        await operations(db);
    }
    catch (err) {
        res.status(500).json({message: 'Error connecting to db', err})
    }
    finally {
        await client.close();
    }
};

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName  = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(articlesInfo);
    }, res)
    

    // const uri = 'mongodb+srv://admin:Systie267@devcamper.mdih4.mongodb.net/?retryWrites=true&w=majority';
    // const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    // try {
    //     await client.connect();
    //     const db = client.db('my-blog');
    //     const articlesInfo = await db.collection('articles').findOne({name: articleName});
    //     res.status(200).json(articlesInfo);
    // }
    // catch (err) {
    //     res.status(500).json({message: 'Error connecting to db', err})
    // }
    // finally {
    //     await client.close();
    // }
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {'$set': {
            upvotes: articleInfo.upvotes + 1, },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res)
    
})

app.post('/api/articles/:name/add-comment', (req, res) => {
    const {username, text} = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {'$set': {
            comments: articleInfo.comments.concat({username, text}) },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res)
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('listening on port 8000'));