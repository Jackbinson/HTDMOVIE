const https = require('https');

const NOTION_API_HOST = 'api.notion.com';
const NOTION_VERSION = '2026-03-11';

const ensureNotionToken = () => {
  if (!process.env.NOTION_API_KEY) {
    const error = new Error('Thieu cau hinh NOTION_API_KEY.');
    error.statusCode = 500;
    throw error;
  }
};

const notionRequest = ({ method, path, body }) =>
  new Promise((resolve, reject) => {
    ensureNotionToken();

    const payload = body ? JSON.stringify(body) : null;

    const request = https.request(
      {
        hostname: NOTION_API_HOST,
        path,
        method,
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      response => {
        let rawData = '';

        response.on('data', chunk => {
          rawData += chunk;
        });

        response.on('end', () => {
          let parsedBody = null;

          try {
            parsedBody = rawData ? JSON.parse(rawData) : null;
          } catch (error) {
            const parseError = new Error('Khong the doc phan hoi tu Notion API.');
            parseError.statusCode = 502;
            return reject(parseError);
          }

          if (response.statusCode >= 400) {
            const requestError = new Error(
              parsedBody?.message || 'Notion API tra ve loi khi xu ly yeu cau.'
            );
            requestError.statusCode = response.statusCode;
            requestError.details = parsedBody;
            return reject(requestError);
          }

          return resolve(parsedBody);
        });
      }
    );

    request.on('error', error => {
      const requestError = new Error(`Khong the ket noi toi Notion API: ${error.message}`);
      requestError.statusCode = 502;
      reject(requestError);
    });

    if (payload) {
      request.write(payload);
    }

    request.end();
  });

const buildCreatePagePayload = ({ title, markdown, parentPageId, dataSourceId, titlePropertyName }) => {
  const parent = dataSourceId
    ? { data_source_id: dataSourceId }
    : { page_id: parentPageId };

  const properties = dataSourceId
    ? {
        [titlePropertyName]: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      }
    : {
        title: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      };

  return {
    parent,
    properties,
    markdown
  };
};

exports.getNotionConfig = () => {
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID?.trim();
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID?.trim();
  const titlePropertyName =
    process.env.NOTION_DATA_SOURCE_TITLE_PROPERTY?.trim() || 'Name';

  return {
    configured: Boolean(process.env.NOTION_API_KEY && (dataSourceId || parentPageId)),
    dataSourceId: dataSourceId || null,
    parentPageId: parentPageId || null,
    titlePropertyName
  };
};

exports.createManagementReportPage = async ({ title, markdown }) => {
  const notionConfig = exports.getNotionConfig();

  if (!notionConfig.dataSourceId && !notionConfig.parentPageId) {
    const error = new Error(
      'Can cau hinh NOTION_PARENT_PAGE_ID hoac NOTION_DATA_SOURCE_ID de xuat bao cao.'
    );
    error.statusCode = 500;
    throw error;
  }

  return notionRequest({
    method: 'POST',
    path: '/v1/pages',
    body: buildCreatePagePayload({
      title,
      markdown,
      parentPageId: notionConfig.parentPageId,
      dataSourceId: notionConfig.dataSourceId,
      titlePropertyName: notionConfig.titlePropertyName
    })
  });
};
