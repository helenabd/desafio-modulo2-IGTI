import express from 'express';
import { promises as fs } from 'fs';

const { readFile, writeFile } = fs;

const router = express.Router();

// MÉTODO POST - Inserir dados no array
router.post('/', async (req, res, next) => {
  try {
    // Variável para receber os dados
    let grade = req.body;

    // Validar dados
    if (
      !grade.student ||
      !grade.subject ||
      !grade.type ||
      grade.value === null
    ) {
      throw new Error('Student, Subject, Type e Value são obrigatórios');
    }

    // Ler o arquivo e salvar em uma variável o array de grades
    const data = JSON.parse(await readFile(global.fileName));

    // criar a estrutura do objeto novamente e alterar o id do array
    grade = {
      id: data.nextId++,
      student: grade.student,
      subject: grade.subject,
      type: grade.type,
      value: grade.value,
      timestamp: new Date(),
    };

    // inserir o objeto criado
    data.grades.push(grade);

    // adicionar dados ao arquivo json, sobreescrever o conteúdo
    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    // Mostrar ao usuário dados inseridos
    res.send(grade);

    logger.info(`POST /grade - ${JSON.stringify(grade)}`);
  } catch (err) {
    next(err);
  }
});

// MÉTODO PUT - Realiza a atualização das informações do registro passado como parâmetro
// PUT para atualizações integrais
router.put('/', async (req, res, next) => {
  try {
    // variável para receber os dados da conta
    const grade = req.body;

    // Validar dados
    if (
      !grade.id ||
      !grade.student ||
      !grade.subject ||
      !grade.type ||
      grade.value === null
    ) {
      throw new Error('Id, Student, Subject, Type e Value são obrigatórios');
    }

    // leitura dos dados
    const data = JSON.parse(await readFile(global.fileName));

    // Procurar o index da conta que desejamos alterar, pelo ID
    const index = data.grades.findIndex((gr) => gr.id === grade.id);

    // Validação de dados
    if (index === -1) {
      throw new Error('Registro não encontrado');
    }

    // Através do index, localizamos os dados e atribuímos novos valores
    data.grades[index].student = grade.student;
    data.grades[index].subject = grade.subject;
    data.grades[index].type = grade.type;
    data.grades[index].value = grade.value;

    // Sobreescrever dados no arquivo
    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    res.send(grade);

    logger.info(`PUT /grade - ${JSON.stringify(grade)}`);
  } catch (err) {
    next(err);
  }
});

// MÉTODO DELETE - Realiza exclusão do registro do ID passado como parâmetro
router.delete('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));

    /*  Filter para pegar todos os valores diferentes da condição, 
    para remoção de um ID. O filter retorna um array*/
    data.grades = data.grades.filter(
      (grade) => grade.id !== parseInt(req.params.id)
    );
    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    res.end();

    logger.info(`DELETE /grade/:id - ${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// MÉTODO GET - Ler o conteúdo e retornar para o usuário
router.get('/', async (req, res, next) => {
  try {
    // ler arquivo
    const data = JSON.parse(await readFile(global.fileName));

    // remover propriedade id do array
    delete data.nextId;

    // retornar para o usuário
    res.send(data);

    logger.info(`GET /grade`);
  } catch (err) {
    next(err);
  }
});

// MÉTODO GET(id) - Ler o conteúdo e retornar para o usuário através do ID
router.get('/:id', async (req, res, next) => {
  try {
    // ler arquivo
    const data = JSON.parse(await readFile(global.fileName));

    // buscar o ID com o find e retornar ele
    const grade = data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    );
    res.send(grade);

    logger.info(`GET /grade/:id`);
  } catch (err) {
    next(err);
  }
});

/*MÉTODO GET(student, subject) - Ler o conteúdo de student e 
retornar para o usuário a soma de nota do mesmo*/
router.get('/:student/:subject', async (req, res, next) => {
  try {
    // ler arquivo
    const data = JSON.parse(await readFile(global.fileName));

    // buscar o student
    const grade = data.grades.filter(
      (grade) =>
        grade.student === req.params.student &&
        grade.subject === req.params.subject
    );

    // Pegar os valores filtrados
    const values = grade.map((value) => value.value);

    // Soma das notas
    const sum = values.reduce((acc, cur) => acc + cur);

    res.send(`The sum of this student's grades in this subject is ${sum}`);

    logger.info(`GET /grade/:student/:subject`);
  } catch (err) {
    next(err);
  }
});

/*MÉTODO GET(subject, type) - Ler o conteúdo de subject e type e
retorna para o usuário a média de notas*/
router.get('/average/:subject/:type', async (req, res, next) => {
  try {
    // ler arquivo
    const data = JSON.parse(await readFile(global.fileName));

    // buscar o subject e o type
    const grade = data.grades.filter(
      (grade) =>
        grade.subject === req.params.subject && grade.type === req.params.type
    );

    // Pegar os valores do subject e type filtrados
    const values = grade.map((value) => value.value);

    // Soma das notas
    const sum = values.reduce((acc, cur) => acc + cur);

    // Média dos valores filtrados
    const average = sum / values.length;

    res.send(`
    <strong>Subject:</strong> ${req.params.subject}<br>
    <strong>Type:</strong> ${req.params.type}<br>
    <strong>Avarage of Grades:</strong> ${average.toFixed(2)}`);

    logger.info(`GET /grade/average/:subject/:type`);
  } catch (err) {
    next(err);
  }
});

/*MÉTODO GET(subject, type) - Ler o conteúdo de subject e type e
retorna para o usuário a média de notas*/
router.get('/top3/:subject/:type', async (req, res, next) => {
  try {
    // ler arquivo
    const data = JSON.parse(await readFile(global.fileName));

    // buscar o subject e o type
    const grade = data.grades.filter(
      (grade) =>
        grade.subject === req.params.subject && grade.type === req.params.type
    );

    /*Pegar os valores do subject e type filtrados, colocar em ordem decrescente
    e indicar os 3 primeiros*/
    const top3 = grade
      .map((value) => value.value)
      .sort((a, b) => b - a)
      .slice(0, 3);

    res.send(top3);

    logger.info(`GET /grade/top3/:subject/:type`);
  } catch (err) {
    next(err);
  }
});

// Tratamento de erro de todos os endpoints acima
router.use((err, req, res, next) => {
  global.logger.error(`${req.method} ${req.baseUrl} ${err.message}`);
  res.status(400).send({ error: err.message });
});

export default router;
