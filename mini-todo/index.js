import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

let todos = [];
let nextId = 1;

app.post('/todos', (req, res)=>{

    const {title, description, completed} = req.body;

    if (!title || !description) {
        return res.status(400).json({
            error: "Title and description are required"
        });
    }

    const newTodo = {
        id: nextId++,
        title,
        description,
        completed: completed || false
    };

    todos.push(newTodo);

    res.status(201).json(newTodo);


})

app.get('/todos', (req, res) => {
    res.status(200).json(todos);
});

app.get('/todos/:id', (req, res) => {
    const id = Number(req.params.id);
    const todo = todos.find((t) => t.id === id);

    if (!todo) {
        return res.status(404).json({
            error: "Todo not found"
        });
    }

    res.status(200).json(todo);
})


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
