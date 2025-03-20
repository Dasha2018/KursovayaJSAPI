import { getPosts, addPost } from "./api";
import { renderAddPostPageComponent } from "./components/add-post-page-component";
import { renderAuthPageComponent } from "./components/auth-page-component";
import { renderUserPostsPageComponent } from "./components/user-posts-page-component";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./helpers.js";

export let user = getUserFromLocalStorage();
export let page = null;
export let posts = [];

export const updatePosts = (newPosts) => {
  posts = newPosts;
};

export const getToken = () => {
  const token = user ? `Bearer ${user.token}` : undefined;

  return token;
};

/**
 * Включает страницу приложения
 */
export const goToPage = (newPage, data) => {
  if (
    [
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    if (newPage === ADD_POSTS_PAGE) {
      page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
      return renderApp();
    }

    if (newPage === POSTS_PAGE) {
      page = LOADING_PAGE;
      renderApp();
    
      const savedPosts = JSON.parse(localStorage.getItem("posts"));
    
      if (savedPosts) {
        page = POSTS_PAGE;
        posts = savedPosts;
        renderApp();
      }
    
      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          goToPage(POSTS_PAGE);
        });
    }
    

    if (newPage === USER_POSTS_PAGE) {
      page = USER_POSTS_PAGE;
      return renderUserPostsPageComponent({
        appEl: document.getElementById("app"),
        userId: data.userId,
      });
    }

    page = newPage;
    renderApp();

    return;
  }

  throw new Error("страницы не существует");
};

const renderApp = () => {
  const appEl = document.getElementById("app");
  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(user);
        goToPage(POSTS_PAGE);
        setTimeout(() => {}, 0);
      },
    });
  }

  if (page === ADD_POSTS_PAGE) {
    return renderAddPostPageComponent({
      appEl,
      posts,
      onAddPostClick({ description, imageUrl }) {
        if (!description) {
          alert("Введите описание поста.");
          return;
        }

        if (!imageUrl) {
          alert("Выберите изображение перед добавлением поста.");
          return;
        }

        console.log("Добавляю пост...", { description, imageUrl });

        addPost({
          description,
          imageUrl,
          token: getToken(),
        })
          .then(() => {
            console.log("Пост успешно добавлен!");
            goToPage(POSTS_PAGE);
          })
          .catch((error) => {
            console.error("Ошибка при добавлении поста:", error);
            alert("Ошибка при добавлении поста. Попробуйте еще раз.");
          });
      },
    });
  }

  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
      posts,
    });
  }

  if (newPage === USER_POSTS_PAGE) {
    console.log("Переход на страницу пользователя. User:", user);
    page = USER_POSTS_PAGE;
    renderApp();
    return renderUserPostsPageComponent({
      appEl: document.getElementById("app"),
      userId: data.userId,
      user, // Проверяем, передается ли user
    });
  }
};
export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
  setTimeout(() => {}, 0);
};

// Инициализация приложения
goToPage(POSTS_PAGE);
