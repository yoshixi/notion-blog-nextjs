import Head from "next/head";
import Link from "next/link";
import { getDatabase } from "../lib/notion";
import { Text } from "./[id].js";
import styles from "./index.module.css";

export const databaseId = process.env.NOTION_DATABASE_ID;
const externalDatabaseId = process.env.NOTION_EXTERNAL_POSTS_DATABASE_ID;
const RECOMMENDED_TAG_NAME = "POST";

export default function Home({ posts, externalPosts }) {
  return (
    <div>
      <Head>
        <title>Keep it fun</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logos}></div>
          <h1>Keep it fun</h1>
          <div style={{ marginBottom: "40px" }}>
            <Link href={"/en"}>
              <a>
                <span className={styles.pageLink}>
                  English Site is here 🇺🇸;
                </span>
              </a>
            </Link>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.heading}>Profile</h2>
          <p>
            このサイトは{" "}
            <a href="https://twitter.com/yoshixi_dev" target="_blank">
              @yoshixi
            </a>{" "}
            の個人サイトです。{" "}
            <a href="https://twitter.com/yoshixi_dev" target="_blank">
              @yoshixi
            </a>
            は北関東出身、東京で働いているソフトウェアエンジニーアです。 経歴は
            <a
              href="https://github.com/yoshixi/resume/blob/master/README.md"
              target="_blank"
            >
              こちら
            </a>
            をご確認ください。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>POSTS</h2>
          <div style={{ marginBottom: "3rem" }}>
            <details>
              <summary style={{ height: "20px" }}>
                <span className={styles.summary}> External POSTS </span>
              </summary>
              <ol className={styles.posts}>
                {externalPosts.map((post) => {
                  const date = new Date(post.created_time).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }
                  );
                  return (
                    <li key={post.id} className={styles.post}>
                      <h3 className={styles.postTitle}>
                        <a href={post.properties.URL.url} target="_blank">
                          <Text text={post.properties.Name?.title} />
                        </a>
                      </h3>

                      <p className={styles.postDescription}>{date}</p>

                      <a href={post.properties.URL.url} target="_blank">
                        {
                          post.properties.URL.url?.match(
                            /^https?:\/{2,}(.*?)(?:\/|\?|#|$)/
                          )[1]
                        }
                        →
                      </a>
                    </li>
                  );
                })}
              </ol>
            </details>
          </div>
          <ol className={styles.posts}>
            {posts.map((post) => {
              const date = new Date(
                post.properties.Date.date?.start
              ).toLocaleString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              });
              return (
                <li key={post.id} className={styles.post}>
                  <h3 className={styles.postTitle}>
                    <Link
                      href={`/${post.properties.Slug.rich_text[0]?.plain_text}`}
                    >
                      <a>
                        <Text text={post.properties.Name?.title} />
                      </a>
                    </Link>
                  </h3>

                  <p className={styles.postDescription}>{date}</p>
                  <Link
                    href={`/${post.properties.Slug.rich_text[0]?.plain_text}`}
                  >
                    <a> Read post →</a>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </div>
  );
}

export const getStaticProps = async () => {
  const database = await getDatabase(databaseId);
  const externalDatabase = await getDatabase(externalDatabaseId);

  const publishedPosts = database
    .filter((el) => el.properties.Published.checkbox)
    .sort(
      (a, b) =>
        new Date(b.properties.Date.date?.start) -
        new Date(a.properties.Date.date?.start)
    );

  const jaPosts = publishedPosts.filter(
    (el) => el.properties.Language.select.name === "ja"
  );
  const recommendedPosts = publishedPosts.filter((el) =>
    el.properties.Tags.multi_select
      .map((tag) => tag.name)
      .includes(RECOMMENDED_TAG_NAME)
  );

  return {
    props: {
      externalPosts: externalDatabase,
      posts: jaPosts,
      recommendedPosts,
    },
    revalidate: 1,
  };
};
