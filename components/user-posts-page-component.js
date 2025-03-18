import { renderHeaderComponent } from "./header-component.js";
import { getToken } from "../index.js";
import { setLike, removeLike, getPosts } from "../api";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { renderPostsPageComponent } from "./posts-page-component.js";

export function renderUserPostsPageComponent({ appEl, userId, user }) {
  appEl.innerHTML = "Загрузка постов...";

  const token = getToken();

  getPosts({ token })
    .then((posts) => {
      const userPosts = posts.filter((post) => post.user.id === userId);

      const postsHtml = userPosts
  .map((post) => {
    return `
      <li class="post" data-post-id="${post.id}">
        <div class="post-header" data-user-id="${post.user.id}">
            <img src="${post.user.imageUrl}" 
                 class="post-header__user-image" 
                 alt="${post.user.name}">
            <p class="post-header__user-name">${post.user.name}</p>
        </div>
        <div class="post-image-container">
          <img class="post-image" src="${post.imageUrl}" 
               alt="Изображение поста">
        </div>
        <div class="post-likes">
          <button class="like-button" data-post-id="${post.id}">
            <img src="./assets/images/${
              post.isLiked ? "like-active" : "like-not-active"
            }.svg" alt="Кнопка лайка">
          </button>
          <p class="post-likes-text">
            Нравится: <strong>${post.likes.counter}</strong>
          </p>
        </div>
        <p class="post-text">
          <span class="user-name">${post.user.name}</span>
          ${post.text}
        </p>
        <p class="post-date">${formatDistanceToNow(
          new Date(post.createdAt),
          {
            addSuffix: true,
            locale: ru,
          }
        )}</p>
      </li>`;
  })
  .join("");

      appEl.innerHTML = `
          <div class="page-container">
            <div class="header-container"></div>
            <ul class="posts">
              ${postsHtml}
            </ul>
          </div>`;

      renderHeaderComponent({
        element: document.querySelector(".header-container"),
        user,
      });
      for (let likeButton of document.querySelectorAll(".like-button")) {
        likeButton.addEventListener("click", async (event) => {
          event.preventDefault();
          const postId = likeButton.dataset.postId; // Получаем postId
          const post = posts.find((post) => post.id.toString() === postId); // Находим пост
          const token = getToken();
      
          if (!token) {
            alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
            return;
          }
      
          if (!post) { // Проверяем, что пост существует
            console.error(`Пост с id ${postId} не найден.`);
            return;
          }
      
          try {
            // Если пост лайкнут, снимаем лайк, иначе ставим лайк
            if (post.isLiked) {
              await removeLike({ postId, token });
              post.isLiked = false;
              post.likes.counter--; // Уменьшаем счетчик
            } else {
              await setLike({ postId, token });
              post.isLiked = true;
              post.likes.counter++; // Увеличиваем счетчик
            }
      
            // Обновляем UI
            renderPostsPageComponent({ appEl, posts });
      
          } catch (error) {
            console.error("Ошибка при изменении лайка:", error);
          }
        });
      }    
      
    })
    .catch((error) => {
      console.error("Ошибка загрузки постов:", error);
      appEl.innerHTML = "Ошибка при загрузке постов.";
    });
}
