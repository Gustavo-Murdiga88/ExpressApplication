import { randomUUID } from "node:crypto";
import express from "express";

const costumers = [];

const app = express();

function balance(statement) {
  const amount = statement.reduce((amount, currentValue) => {
    if (currentValue.type === "deposit") {
      return amount + currentValue.amount;
    }

    return amount - currentValue.amount;
  }, 0);

  return amount;
}

function verifyCPFExists(req, res, next) {
  const { cpf } = req.headers;

  const costumer = costumers.find((item) => item.cpf === cpf);

  if (!costumer) {
    return res.status(400).send({
      error: "CPF not exists",
    });
  }

  req.costumer = costumer;

  return next();
}

app.use(express.json());

app.post("/costumers", (req, res) => {
  const { cpf } = req.headers;
  const { name } = req.body;
  const id = randomUUID();

  const cpfAlreadyExists = costumers.some((value) => value.cpf === cpf);

  if (cpf && name && !cpfAlreadyExists) {
    costumers.push({ id, cpf, name, statement: [] });
    return res.status(201).send(costumers);
  }

  if (cpfAlreadyExists) {
    return res.status(400).send({ error: "CPF already exists!" });
  }
});

app.put('/costumers', verifyCPFExists, (req, res) => {
  const { name } = req.body;
  const {costumer} = req;

  costumer.name = name;

  return res.status(200).send({costumer})
})

app.delete('/costumers', verifyCPFExists, (req, res) => {
  const { name } = req.body;
  const {costumer} = req;

  const index = costumers.indexOf((item) => item.cpf === costumer.cpf);

  costumers.splice(index, 1);

  return res.status(200).send({message: 'Costumer excluded with success'})
})

app.get("/costumers", (req, res) => {
  return res.send(costumers);
});

app.post("/deposit", verifyCPFExists, (req, res) => {
  const { amount } = req.body;

  const { costumer } = req;

  const statement = {
    create_at: new Date(),
    amount,
    type: "deposit",
  };

  costumer.statement.push(statement);
  return res.status(201).send({
    message: "Deposit created successfully",
  });
});

app.post("/withdraw", verifyCPFExists, (req, res) => {
  const { amount } = req.body;

  const { costumer } = req;

  const total = balance(costumer.statement);

  if (amount > total) {
    return res.status(400).send({ message: "insufficient funds" });
  }

  const statement = {
    create_at: new Date(),
    amount,
    type: "withdraw", 
  };

  costumer.statement.push(statement);
  return res.status(201).send({
    message: "withdraw created successfully",
    statement, 
    total: total - amount
  });
});

app.get('/date', verifyCPFExists, (req, res) => {
  const { date } = req.query; 
  const { costumer } = req;

  const dateFormatted = new Date(date + ' 00:00').toDateString();

  const statements = costumer.statement.filter(( item ) => new Date(item.create_at).toDateString() === dateFormatted )
 
  return res.status(200).send(statements)

})

app.get("/amount", verifyCPFExists, (req, res) => {
  const costumer = req.costumer;
  const { statement } = costumer;

  const amount = balance(statement);

  return res.status(200).send({
    cpf: costumer.cpf,
    name: costumer.name,
    amount,
  });
});

app.listen(3333, () => {
  console.log("server online");
});
