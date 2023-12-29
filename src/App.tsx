import { For, Show, createResource } from "solid-js";
import _ from "lodash";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const URL = "https://jsonplaceholder.typicode.com";

const [todos, { mutate }] = createResource(fetchTodos);

async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(`${URL}/todos`);
  return await response.json();
}

async function handleClick(todo: Todo) {
  mutate((prev) => {
    const idx = prev!.findIndex((t) => t.id === todo.id);
    const newState = [...prev!];
    newState.splice(idx, 1, { ...todo, completed: !todo.completed });
    return newState;
  });
  const response = await fetch(`${URL}/todos/${todo.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      completed: !todo.completed,
    }),
  });
  return await response.json();
}

async function handleCreate() {
  const response = await fetch(`${URL}/todos`, {
    method: "POST",
    body: JSON.stringify({
      title: "",
    }),
  });
  const json = await response.json();
  mutate((prev) => {
    const newTodo: Todo = {
      id: json.id,
      title: "",
      completed: false,
    };
    const newState = [newTodo, ...prev!];
    return newState;
  });
}

const debouncedTitleChange = _.debounce(
  async (newTitle: string, todo: Todo) => {
    await fetch(`${URL}/todos/${todo.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: newTitle,
      }),
    });
    mutate((prev) => {
      const idx = prev!.findIndex((t) => t.id === todo.id);
      const newState = [...prev!];
      newState.splice(idx, 1, { ...todo, title: newTitle });
      return newState;
    });
  },
  500
);

async function handleTitleChange(e: Event, todo: Todo) {
  const target = e.target as HTMLInputElement;
  debouncedTitleChange(target.value, todo);
}

async function handleDelete(todo: Todo) {
  mutate((prev) => {
    const idx = prev!.findIndex((t) => t.id === todo.id);
    const newState = [...prev!];
    newState.splice(idx, 1);
    return newState;
  });
  await fetch(`${URL}/todos/${todo.id}`, {
    method: "DELETE",
  });
}

function addTenThousandToDos() {
  const newTodos: Todo[] = [];
  for (let i = 0; i < 10000; i++) {
    newTodos.push({ id: 1000 + i, title: `to do ${i}`, completed: false });
  }
  mutate((prev) => {
    return [...newTodos, ...prev!];
  });
}

function App() {
  return (
    <div>
      <h1>Solid.js TODO</h1>
      <Show when={!todos.loading} fallback={<div>Loading...</div>}>
        <button onClick={handleCreate}>Create New To Do</button>
        <button onClick={addTenThousandToDos}>Add 10,000 To Dos</button>
        <ul class="todo-list">
          <For each={todos()}>
            {(todo) => (
              <li>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleClick(todo)}
                />{" "}
                <input
                  type="text"
                  value={todo.title}
                  onInput={(e) => handleTitleChange(e, todo)}
                />
                <button onClick={() => handleDelete(todo)}>delete</button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}

export default App;
