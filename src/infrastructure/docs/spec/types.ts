export interface OpenApiPathItem {
  get?: any;
  post?: any;
  put?: any;
  patch?: any;
  delete?: any;
}

export interface OpenApiPaths {
  [path: string]: OpenApiPathItem;
}

export function okResponse(description = 'Successful response', schemaRef?: string) {
  return {
    200: {
      description,
      content: {
        'application/json': {
          schema: schemaRef ? { $ref: `#/components/schemas/${schemaRef}` } : { $ref: '#/components/schemas/ApiResponse' },
        },
      },
    },
  };
}

export function createdResponse(description = 'Resource created successfully', schemaRef?: string) {
  return {
    201: {
      description,
      content: {
        'application/json': {
          schema: schemaRef ? { $ref: `#/components/schemas/${schemaRef}` } : { $ref: '#/components/schemas/ApiResponse' },
        },
      },
    },
  };
}

export function jsonBody(schema: any, required = true) {
  return {
    required,
    content: {
      'application/json': {
        schema: typeof schema === 'string' ? { $ref: `#/components/schemas/${schema}` } : schema,
      },
    },
  };
}

export function queryParam(name: string, description = '', type = 'string', example?: any) {
  return {
    name,
    in: 'query',
    description,
    schema: { type, ...(example !== undefined ? { example } : {}) },
  };
}

export function pathParam(name: string, description = '', type = 'string', example?: any) {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: { type, ...(example !== undefined ? { example } : {}) },
  };
}
