import fetch from "node-fetch";

function fix(expr, k, i, l) {
  if (k[0] === '[' && k[k.length - 1] === ']') {
    const res = [];
    if (i > 0) res.push('} & {');
    res.push(`${expr}`);
    if (i < l - 1) res.push('} & {');
    return res.join('');
  }
  return expr;
}

console.clear();
function indent(length) {
  return Array.from({ length })
    .map(r => '  ')
    .join('');
}

function getResultType(schema, fallbackType = 'void') {
  let responseOk = schema?.items?.$ref?.split(/[+\/]/)?.pop() ?? schema?.items?.type;

  if (responseOk && schema.type === 'array')
    return responseOk + '[]';

  responseOk = schema?.$ref?.split(/[+\/]/)?.pop();

  if (responseOk)
    return responseOk;

  if (schema?.type === 'object' && schema.additionalProperties)
    return { integer: 'number' }[schema.additionalProperties.type] ?? 'string'

  if (schema?.type === 'object' && schema.properties)
    return '{' + Object
      .entries(schema.properties)
      .map(([key, desc]) => `${key}: ${getResultType(desc)}`)
      .join(', ') + '}'

  return { integer: 'number' }[schema?.type] ?? schema?.type ?? fallbackType;
}

function getResponseOk(responses) {
  let firstOk = Object.keys(responses ?? {}).find(code => code[0] === '2')
  if (firstOk)
    return responses?.[firstOk]?.schema
  return undefined
}

function toString(l = 0) {
  // @ts-ignore
  const $ = this;

  let { get, post, patch, put, delete: del, toString, ...desc } = $,
    res = [
      `{
${indent(l + 1)}${Object.entries(desc)
        .filter(([k]) => k != 'toString')
        .map(([k, v], i, { length }) => {
          const val = v.toString(l + 1);
          return fix(`${k} : ${val || '{}'}`, k, i, length)
        }).join(`
${indent(l + 1)}`)
      }
${indent(l)}}`
    ];

  if (res[0].slice(1, -1).trim() === '') 
    res = [];
  
  if (get && !get.deprecated) {
    let {
      body, 
      query, 
      hasBody = !!body, 
      hasQuery = query !== '{}',
      returnType = getResultType(getResponseOk(get.responses))
    } = getParams(get.parameters);

    if(hasBody && !hasQuery)
      res.push(`HttpGetData<${body}, ${returnType}>`);
    else if(!hasBody && hasQuery)
      res.push(`HttpGetQuery<${returnType}, ${query}>`);
    else if(hasBody && hasQuery)
      res.push(`HttpGetFull<${returnType}, ${query}, ${body}>`);
    else 
      res.push(`HttpGet<${returnType}>`);
  }
  
  if (del && !del.deprecated) {
    let {
      body, 
      query, 
      hasBody = !!body, 
      hasQuery = query !== '{}',
      returnType = getResultType(getResponseOk(del.responses))
    } = getParams(del.parameters);

    if(hasBody && !hasQuery)
      res.push(`HttpDeleteData<${body}, ${returnType}>`);
    else if(!hasBody && hasQuery)
      res.push(`HttpDeleteQuery<${query}, ${returnType}>`);
    else if(hasBody && hasQuery)
      res.push(`HttpDeleteFull<${query}, ${body}, ${returnType}>`);
    else 
      res.push(`HttpDelete<${returnType}>`);
  }
  
  if (post && !post.deprecated)
  {
    let {
      body, 
      query, 
      hasBody = !!body, 
      hasQuery = query !== '{}',
      returnType = getResultType(getResponseOk(post.responses))
    } = getParams(post.parameters);

    if(hasBody && !hasQuery)
      res.push(`HttpPostData<${body}, ${returnType}>`);
    else if(!hasBody && hasQuery)
      res.push(`HttpPostQuery<${returnType}, ${query}>`);
    else if(hasBody && hasQuery)
      res.push(`HttpPostFull<${returnType}, ${query}, ${body}>`);
    else
      res.push(`HttpPost<${returnType}>`);
  }
  
  if (put && !put.deprecated)
  {
    let {
      body, 
      query, 
      hasBody = !!body, 
      hasQuery = query !== '{}',
      returnType = getResultType(getResponseOk(put.responses))
    } = getParams(put.parameters);

    if(hasBody && !hasQuery)
      res.push(`HttpPutData<${body}, ${returnType}>`);
    else if(!hasBody && hasQuery)
      res.push(`HttpPutQuery<${returnType}, ${query}>`);
    else if(hasBody && hasQuery)
      res.push(`HttpPutFull<${returnType}, ${query}, ${body}>`);
    else
      res.push(`HttpPut<${returnType}>`);
  }
  
  if (patch && !patch.deprecated)
  {
    let {
      body, 
      query, 
      hasBody = !!body, 
      hasQuery = query !== '{}',
      returnType = getResultType(getResponseOk(patch.responses))
    } = getParams(patch.parameters);

    if(hasBody && !hasQuery)
      res.push(`HttpPatchData<${body}, ${returnType}>`);
    else if(!hasBody && hasQuery)
      res.push(`HttpPatchQuery<${returnType}, ${query}>`);
    else if(hasBody && hasQuery)
      res.push(`HttpPatchFull<${returnType}, ${query}, ${body}>`);
    else
      res.push(`HttpPatch<${returnType}>`);
  }

  return res.join(' & ');
}

const camelCase = p => p
  .replace(/^[A-Z]/, m => m.toLowerCase())
  .replace(/-[a-z]/g, m => m.slice(1).toUpperCase());

function getParams(parameters) {
  if(!(parameters instanceof Array))
    parameters = [];
  return {body: getResultType(parameters?.find(el => el.in === 'body')?.schema, null) ??
    (parameters?.some(el => el.in === 'formData') === true ? 'FormData' : null) ?? '',
    query: `{${parameters
      ?.filter(({ in: _in }) => _in === 'query')
      ?.map(
        ({ name, schema: { type } = {} }) =>
          camelCase(name) + ': ' + (type === 'integer' ? 'number' : 'string')
      )
      ?.join(', ') ?? ''
    }}`
  };
}

function findPathParam(
  _name,
  {
    get: { parameters: getP } = { parameters: [] },
    post: { parameters: postP } = { parameters: [] },
    patch: { parameters: patchP } = { parameters: [] },
    put: { parameters: putP } = { parameters: [] },
    delete: { parameters: deleteP } = { parameters: [] }
  } = {}
) {
  let type = Object.keys(
    getP
      .concat(postP)
      .concat(putP)
      .concat(patchP)
      .concat(deleteP)
      .filter(({ name, in: _in }) => _in === 'path' && _name === name)
      .reduce(
        (res, { schema: { type } = {} }) => (
          (res[type] = true), res
        ),
        {}
      )
  ).join(' | ');
  return `[${_name}: ${type === 'integer' ? 'number' : 'string'}]`;
}

function getTypes(definitions) {
  return (
    Object.entries(definitions).map(([typeName, descriptor]) => {
      typeName = typeName.split('+').pop();
      return `
export class ${typeName} {
  ${Object.entries(descriptor.properties).map(([prop, desc]) => {
        return `${camelCase(prop)}: ${{ integer: 'number' }[desc.type] ??
          getResultType(desc) ??
          desc.type ??
          'string'
          }`;
      }).join(`
  `)
        }
}`;
    }).join(`
`)
  );
}

export async function processSwagger({ url, name = 'HttpClient', listDeprecated = false }) {

  const h = await fetch(url);
  const e = await h.json();
  return `import DotHttp from 'dot-http';

export type ${name} = ` +
    Object.entries(e.paths)
      .reduce(
        (res, [path, descriptor]) => {
          let last;
          path.split('/')
            .slice(1)
            .forEach((p, i, a) => {
              let part = camelCase(p);
              part =
                p[0] === '{'
                  ? findPathParam(
                    part.slice(1, -1),
                    descriptor
                  )
                  : part;
              if (i === 0) {
                last = res[part] = res[part] ?? {
                  toString
                };
              } else {
                last = last[part] = last[part] ?? {
                  toString
                };
              }
            });
          Object.assign(last, descriptor);
          return res;
        },
        { toString }
      )
      .toString() +
    `
${getTypes(e.definitions)};
`;
};
