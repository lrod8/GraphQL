const express = require('express');
const expressGraphQL = require('express-graphql').graphqlHTTP;
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql');

const app = express();
const PORT = 3000;

const authors = [
    {id: 1, name: 'J. K. Rowling'},
    {id: 2, name: 'J. R. R. Tolkien'},
    {id: 3, name: 'Brent Weeks'}
]

const books = [
    {id: 1, name: 'Harry Potter and the Chamber of Secrets', authorID: 1},
    {id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorID: 1},
    {id: 3, name: 'Harry Potter and the Goblet of Fire', authorID: 1},
    {id: 4, name: 'The Fellowship of the Ring', authorID: 2},
    {id: 5, name: 'The Two Towers', authorID: 2},
    {id: 6, name: 'The Return of the King', authorID: 2},
    {id: 7, name: 'The Way of Shadows', authorID: 3},
    {id: 8, name: 'Beyond the Shadows', authorID: 3}
]

// const schema = new GraphQLSchema({
//     query: new GraphQLObjectType({
//         //spaces are not valid in the name property, i.e. 'Hello World' is not valid
//         name: 'HelloWorld',
//         //fields are all the different sections of the object that we can query to return data from
//         fields: () => ({
//             //message is an object which will define the type of our message
//             message: { 
//                 type: GraphQLString,
//                 //resolve is function that tells GraphQL where to get the info from / what info we are returning
//                 resolve: () => 'Hello World'
//             }
//         })
//     })
// });

//custom GraphQLObjectType
const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'This represents a book written by an author',
    fields: () => ({
        //GraphQLNonNull means the field can never be null
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        authorId: { type: GraphQLNonNull(GraphQLInt) },
        author: {
            type: AuthorType,
            //author is inside of the book type
            resolve: (book) => {
                return authors.find(author => author.id === book.authorID)
            }
         }
    })
});

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'This represents an author of a book',
    fields: () => ({
        //GraphQLNonNull means the field can never be null
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString) },
        books: {
            type: new GraphQLList(BookType),
            resolve: (author) => {
                return books.filter(book => book.authorID === author.id)
            }
        }
    })
});

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    //description will show in the GraphQL documentation
    description: 'Root Query',
    //function definition wrapped in parens so that don't need to add a return statement
    fields: () => ({
        book: {
            type: BookType,
            description: 'A Single Book',
            //args parameter defines which arguments are valid for our query; object defines our arguments
            args: {
                //passing in the id of the book we want to query
                id: { type: GraphQLInt }
            },
            //resolve parameters: parent, args
            resolve: (parent, args) => books.find(book => book.id === args.id)
        },
        books: {
            //BookType is a placeholder value for a custom GraphQLObjectType. Wrapped in GraphQLList because returning a list of book types.
            type: new GraphQLList(BookType),
            description: 'List of All Books',
            //returning the book object. If you were using a database, would query the database here
            resolve: () => books
        },
        author: {
            type: AuthorType,
            description: 'A Single Author',
            args: {
                id: { type: GraphQLInt }
            },
            resolve: (parent, args) => authors.find(author => author.id === args.id)
        },
        authors: {
            type: new GraphQLList(AuthorType),
            description: 'List of All Authors',
            resolve: () => authors
        }
    })
})

//Mutation is GraphQL's version of using POST, PUT, and DELETE in RESTful API
const RootMutationType = new GraphQLObjectType ({
    name: 'Mutation',
    description: 'Root Mutation',
    //Fields is a function because the object types need to be defined first (hoisting?). The object types are dependent on each other being defined
    fields: () => ({
        addBook: {
            type: BookType,
            description: 'Add a Book',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                authorId: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, args) => {
                //ID would be automatically generated in a database
                const book = { 
                    id: books.length + 1,
                    name: args.name,
                    authorId: args.authorId
                }
                books.push(book);
                return book;
            }
        },
        addAuthor: {
            type: AuthorType,
            description: 'Add an Author',
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
            },
            resolve: (parent, args) => {
                const author = {
                    id: authors.length + 1,
                    name: args.name
                }
                authors.push(author);
                return author;
            }
        }
    })
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use('/graphql', expressGraphQL({
    schema: schema,
    graphiql: true
}));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
