/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from 'node:fs';
import { Hook } from '@oclif/core';
import xml2js from 'xml2js';

type RetrieveResult = {
  done: boolean;
  status: string;
  success: true;
  files: RetrieveFile[];
};

type RetrieveFile = {
  fullName: string;
  type: string;
  state: string;
  filePath: string;
};

// eslint-disable-next-line @typescript-eslint/require-await
const hook: Hook.Postrun = async function ({ Command, context, result }) {
  // const { plugin } = Command;
  const retrieveResult = result as RetrieveResult;
  // const filesToSort: RetrieveFile[] = [];

  retrieveResult.files.forEach(async (f) => {
    if (f.type === 'PermissionSet') {
      context.log(`Sorting metadata: ${f.fullName} : ${f.type}`);

      await sortMetadata(f, context);
    }
  });
  // fs.writeFileSync('/Users/heitaraujo/Documents/develop/metadata-sorter/test.txt', 'testttt');
  // fs.writeFileSync('/Users/heitaraujo/Documents/develop/metadata-sorter/result.txt', JSON.stringify(result));
  // fs.writeFileSync('/Users/heitaraujo/Documents/develop/metadata-sorter/command.txt', JSON.stringify(plugin));
  // fs.writeFileSync('/Users/heitaraujo/Documents/develop/metadata-sorter/config.txt', JSON.stringify(config));
  // throw new Error('asd');
  // if (process.argv.includes('--json')) return;
  // if (!plugin) return;
  // if (plugin.type === 'link') return;
  // const jitPlugins = config.pjson.oclif.jitPlugins ?? {};
  // const deps = config.pjson.dependencies ?? {};
  // const specifiedVersion = jitPlugins[plugin.name] ?? deps[plugin.name];
  // if (!specifiedVersion) return;
  // if (plugin.version !== specifiedVersion) {
  //   ux.warn(
  //     `Plugin ${plugin.name} (${plugin.version}) differs from the version specified by ${config.bin} (${specifiedVersion})`
  //   );
  // }
};

const sortMetadata = async function (file: RetrieveFile, context: any): Promise<void> {
  const parser = new xml2js.Parser();
  const permSet = await parser.parseStringPromise(fs.readFileSync(file.filePath));
  const objectPermissions = permSet['PermissionSet']['objectPermissions'];

  objectPermissions.sort((a: any, b: any) => {
    context.log(a['object']);
    if (a['object'] < b['object']) return -1;
    if (a['object'] > b['object']) return 1;
    return 0;
  });

  const fieldPermissions = permSet['PermissionSet']['fieldPermissions'];
  fieldPermissions.sort((a: any, b: any) => {
    // context.log(`${a['field']} - ${b['field']} - ${a['field'] < b['field']}`);
    const fieldA = a['field'].toString();
    const fieldB = b['field'].toString();
    // context.log(`${fieldA} - ${fieldB} - ${a['field'] < b['field']}`);
    const objectNameA = fieldA.split('.')[0];
    const fieldNameA = fieldA.split('.')[1];
    const objectNameB = fieldB.split('.')[0];
    const fieldNameB = fieldB.split('.')[1];
    // const { objectNameA, fieldNameA } = a['field'] as string).split('.');
    // const { objectNameB, fieldNameB } = (b['field'] as string).split('.');

    if (objectNameA.toLowerCase() === objectNameB.toLowerCase()) {
      if (fieldNameA.toLowerCase() < fieldNameB.toLowerCase()) return -1;
      if (fieldNameA.toLowerCase() > fieldNameB.toLowerCase()) return 1;
    } else {
      context.log(`Different objects ${objectNameA} - ${objectNameB} - ${objectNameA < objectNameB}`);
      if (objectNameA.toLowerCase() < objectNameB.toLowerCase()) return -1;
      if (objectNameA.toLowerCase() > objectNameB.toLowerCase()) return 1;
    }

    return 0;
  });

  // rebuild perm set file
  const builder = new xml2js.Builder({
    headless: true, // Exclude standalone="yes" attribute
    renderOpts: {
      pretty: true,
      indent: '    ',
      newline: '\n',
    },
  });
  const xml = builder.buildObject(permSet);
  fs.writeFileSync(file.filePath, '<?xml version="1.0" encoding="UTF-8"?>\n' + xml + '\n');
};

export default hook;
