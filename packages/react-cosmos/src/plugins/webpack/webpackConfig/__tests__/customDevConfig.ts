import webpack from 'webpack';
// NOTE: Mock files need to imported before modules that use the mocked APIs
import { mockCliArgs, unmockCliArgs } from '../../../../testHelpers/mockYargs';
import { mockConsole } from '../../../../testHelpers/mockConsole';
import { mockFile } from '../../../../testHelpers/mockFs';
import { createCosmosConfig } from '../../../../config';
import { RENDERER_FILENAME } from '../../../../shared/playgroundHtml';
import { HtmlWebpackPlugin } from './../htmlPlugin';
import { getDevWebpackConfig } from '..';

beforeAll(() => {
  // Prevent Cosmos from intercepting the --config arg passed to Jest
  mockCliArgs({});
  mockFile('mywebpack.config.js', {
    module: { rules: [MY_RULE] },
    plugins: [MY_PLUGIN]
  });
});

afterAll(() => {
  unmockCliArgs();
});

const MY_RULE = {};
const MY_PLUGIN = {};

async function getCustomDevWebpackConfig() {
  return mockConsole(async ({ expectLog }) => {
    expectLog('[Cosmos] Using webpack config found at mywebpack.config.js');
    const cosmosConfig = createCosmosConfig({
      webpack: {
        configPath: 'mywebpack.config.js'
      }
    });
    return getDevWebpackConfig(cosmosConfig, webpack);
  });
}

it('includes user rule', async () => {
  const { module } = await getCustomDevWebpackConfig();
  expect(module!.rules).toContain(MY_RULE);
});

it('includes user plugin', async () => {
  const { plugins } = await getCustomDevWebpackConfig();
  expect(plugins).toContain(MY_PLUGIN);
});

it('includes client entry', async () => {
  const { entry } = await getCustomDevWebpackConfig();
  expect(entry).toContain(require.resolve('../../client'));
});

it('includes DOM devtooks hook entry', async () => {
  const { entry } = await getCustomDevWebpackConfig();
  expect(entry).toContain(
    require.resolve('../../../../domRenderer/reactDevtoolsHook')
  );
});

it('includes webpack-hot-middleware entry', async () => {
  const { entry } = await getCustomDevWebpackConfig();
  expect(entry).toContain(
    `${require.resolve(
      'webpack-hot-middleware/client'
    )}?reload=true&overlay=false`
  );
});

it('create output', async () => {
  const { output } = await getCustomDevWebpackConfig();
  expect(output).toEqual(
    expect.objectContaining({
      filename: '[name].js',
      path: '/',
      publicPath: '/'
    })
  );
});

it('includes user deps loader', async () => {
  const { module } = await getCustomDevWebpackConfig();
  expect(module!.rules).toContainEqual({
    loader: require.resolve('../userDepsLoader'),
    include: require.resolve('../../client/userDeps')
  });
});

it('includes HtmlWebpackPlugin', async () => {
  const { plugins } = await getCustomDevWebpackConfig();
  const htmlWebpackPlugin = plugins!.find(
    p => p.constructor.name === 'HtmlWebpackPlugin'
  ) as HtmlWebpackPlugin;
  expect(htmlWebpackPlugin).toBeDefined();
  expect(htmlWebpackPlugin.options.filename).toBe(RENDERER_FILENAME);
});

it('includes HotModuleReplacementPlugin', async () => {
  const { plugins } = await getCustomDevWebpackConfig();
  const hotModuleReplacementPlugin = plugins!.find(
    p => p.constructor.name === 'HotModuleReplacementPlugin'
  );
  expect(hotModuleReplacementPlugin).toBeDefined();
});
