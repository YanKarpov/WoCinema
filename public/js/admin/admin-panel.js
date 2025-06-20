      async function checkAdmin() {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (!res.ok) {
          document.body.innerHTML = "<p>Нет доступа. Войдите как админ.</p>";
          throw new Error("Not authorized");
        }
        const user = await res.json();
        if (user.role !== "admin") {
          document.body.innerHTML = "<p>Вы не админ!</p>";
          throw new Error("Not admin");
        }
        document.getElementById(
          "authStatus"
        ).innerHTML = `Здравствуйте, ${user.username} (<button id="logoutBtn">Выйти</button>)`;
        document.getElementById("logoutBtn").onclick = async () => {
          await fetch("/auth/logout", {
            method: "POST",
            credentials: "include",
          });
          location.href = "/";
        };
      }

      async function loadMovies() {
        const res = await fetch("/movies");
        const movies = await res.json();
        const tbody = document.querySelector("#moviesTable tbody");
        tbody.innerHTML = "";
        movies.forEach((movie) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
          <td>${movie.id}</td>
          <td><input value="${movie.title || ""}" /></td>
          <td><input type="number" value="${movie.year || ""}" /></td>
          <td><input value="${(movie.genre || []).join(", ")}" /></td>
          <td><input type="number" value="${movie.tmdbId || ""}" /></td>
          <td class="actions">
            <button class="saveBtn">💾</button>
            <button class="deleteBtn">🗑️</button>
          </td>
        `;
          tbody.appendChild(tr);

          tr.querySelector(".saveBtn").onclick = async () => {
            const inputs = tr.querySelectorAll("input");
            const updated = {
              title: inputs[0].value,
              year: Number(inputs[1].value),
              genre: inputs[2].value.split(",").map((g) => g.trim()),
              tmdbId: Number(inputs[3].value) || undefined,
            };
            await fetch(`/movies/${movie.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(updated),
            });
            alert("Сохранено!");
            loadMovies();
          };

          tr.querySelector(".deleteBtn").onclick = async () => {
            if (confirm("Удалить фильм?")) {
              await fetch(`/movies/${movie.id}`, {
                method: "DELETE",
                credentials: "include",
              });
              alert("Удалено!");
              loadMovies();
            }
          };
        });
      }

      document.getElementById("refreshBtn").onclick = loadMovies;

      document.getElementById("createForm").onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = {
          id: Number(form.id.value),
          tmdbId: form.tmdbId.value ? Number(form.tmdbId.value) : undefined,
        };
        await fetch("/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
        form.reset();
        loadMovies();
      };

      await checkAdmin();
      loadMovies();