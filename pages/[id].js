import { Fragment } from "react";
import Head from "next/head";
import { getDatabase, getPage, getBlocks } from "../lib/notion";
import Link from "next/link";
import { databaseId } from "./index.js";
import styles from "./post.module.css";
import { CopyBlock, nord } from "react-code-blocks";
import { HiExternalLink } from "react-icons/hi";
import { SITE_NAME } from "../lib/constraints";
let allPages = null;

const getSlugFromId = (pageId) => {
  const page = allPages.find((page) => page.id === pageId);
  console.log(page.properties);
  return page.properties.Slug.rich_text[0]?.plain_text;
};

const TextContent = (textValue) => {
  const { text } = textValue;
  if (textValue.type === "mention") {
    console.log(allPages);
    return (
      <Link href={`/${getSlugFromId(textValue.mention.page.id)}`}>
        <a style={{ fontWeight: "bold", color: "black", fontSize: "1.1rem" }}>
          <HiExternalLink style={{ fontSize: "1.5rem" }} />
          <span>{textValue.plain_text} </span>
        </a>
      </Link>
    );
  }
  return text.link ? <a href={text.link.url}>{text?.content}</a> : text.content;
};

export const Text = ({ text }) => {
  if (!text) {
    return null;
  }
  return text.map((value) => {
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text,
    } = value;
    return (
      <span
        className={[
          bold ? styles.bold : "",
          code ? styles.code : "",
          italic ? styles.italic : "",
          strikethrough ? styles.strikethrough : "",
          underline ? styles.underline : "",
        ].join(" ")}
        style={color !== "default" ? { color } : {}}
      >
        {TextContent(value)}
      </span>
    );
  });
};

const renderBlock = (block) => {
  const { type, id } = block;
  const value = block[type];

  switch (type) {
    case "paragraph":
      return (
        <p>
          <Text text={value.text} />
        </p>
      );
    case "heading_1":
      return (
        <h1>
          <Text text={value.text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2>
          <Text text={value.text} />
        </h2>
      );
    case "heading_3":
      return (
        <h3>
          <Text text={value.text} />
        </h3>
      );
    case "bulleted_list_item":
    case "numbered_list_item":
      return (
        <li>
          <Text text={value.text} />
        </li>
      );
    case "to_do":
      return (
        <div>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} />{" "}
            <Text text={value.text} />
          </label>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary>
            <Text text={value.text} />
          </summary>
          {value.children?.map((block) => (
            <Fragment key={block.id}>{renderBlock(block)}</Fragment>
          ))}
        </details>
      );
    case "child_page":
      return <p>{value.title}</p>;
    case "image":
      const src =
        value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure>
          <img src={src} alt={caption} />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    case "code":
      const language = value.language;
      return value.text.map((text) => {
        return (
          <CopyBlock
            text={text.plain_text}
            language={language}
            showLineNumbers={false}
            theme={nord}
          />
        );
      });
    default:
      return `❌ Unsupported block (${
        type === "unsupported" ? "unsupported by Notion API" : type
      })`;
  }
};

export default function Post({ page, blocks, database }) {
  allPages = database;
  console.log(blocks[0]);

  if (!page || !blocks) {
    return <div />;
  }
  return (
    <div>
      <Head>
        <title>{page.properties.Name.title[0].plain_text}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <meta name="description" content={blocks[0]?.title} />
        <meta
          property="og:url"
          content={`https://www.yoshixj.com/${page.properties.Slug.rich_text[0]?.plain_text}`}
        />
        <meta
          property="og:title"
          content={page.properties.Name.title[0].plain_text}
        />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:description" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.yoshixj.com//the_yoshixj_site.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;display=swap"
          rel="stylesheet"
        />
      </Head>

      <article className={styles.container}>
        <h1 className={styles.name}>
          <Text text={page.properties.Name.title} />
        </h1>
        <section>
          {blocks.map((block) => (
            <Fragment key={block.id}>{renderBlock(block)}</Fragment>
          ))}
          <Link href="/">
            <a className={styles.back}>← Go home</a>
          </Link>
        </section>
      </article>
    </div>
  );
}

export const getStaticPaths = async () => {
  const database = await getDatabase(databaseId);
  return {
    paths: database
      .filter((el) => el.properties.Published.checkbox)
      .map((page) => ({
        params: { id: page.properties.Slug.rich_text[0]?.plain_text },
      })),
    fallback: true,
  };
};

export const getStaticProps = async (context) => {
  const { id: slug } = context.params;
  const database = await getDatabase(databaseId);
  const _page = database.find(
    (el) => el.properties.Slug.rich_text[0]?.plain_text === slug
  );
  const id = _page.id;

  const page = await getPage(id);
  const blocks = await getBlocks(id);

  // Retrieve block children for nested blocks (one level deep), for example toggle blocks
  // https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
  const childBlocks = await Promise.all(
    blocks
      .filter((block) => block.has_children)
      .map(async (block) => {
        return {
          id: block.id,
          children: await getBlocks(block.id),
        };
      })
  );
  const blocksWithChildren = blocks.map((block) => {
    // Add child blocks if the block should contain children but none exists
    if (block.has_children && !block[block.type].children) {
      block[block.type]["children"] = childBlocks.find(
        (x) => x.id === block.id
      )?.children;
    }
    return block;
  });

  return {
    props: {
      page,
      database,
      blocks: blocksWithChildren,
    },
    revalidate: 1,
  };
};
