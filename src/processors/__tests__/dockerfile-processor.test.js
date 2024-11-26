import processDockerfileTemplate from '../dockerfile-processor';

describe('Dockerfile Processor', () => {
  test('processes template without hooks', async () => {
    const result = await processDockerfileTemplate();

    // Check core elements remain
    expect(result).toContain('FROM node:18-alpine AS deps');
    expect(result).toContain('ARG APP_VERSION');
    expect(result).toContain('ENV APP_VERSION=${APP_VERSION}');
    expect(result).not.toContain('[HOOK:');  // No hook markers should remain
  });

  test('injects hooks correctly', async () => {
    const hooks = {
      additionalBuildArgs: [
        'ARG CUSTOM_ARG="test"',
        'ENV CUSTOM_ENV=${CUSTOM_ARG}'
      ],
      additionalEnv: [
        'ENV EXTRA_VAR="extra"'
      ],
      additionalCopy: [
        'COPY --from=builder /app/extra ./extra'
      ]
    };

    const result = await processDockerfileTemplate({ hooks });

    // Check hook injections
    expect(result).toContain('ARG CUSTOM_ARG="test"');
    expect(result).toContain('ENV CUSTOM_ENV=${CUSTOM_ARG}');
    expect(result).toContain('ENV EXTRA_VAR="extra"');
    expect(result).toContain('COPY --from=builder /app/extra ./extra');
  });

  test('maintains correct Dockerfile structure', async () => {
    const result = await processDockerfileTemplate();

    // Check stage order
    const stageOrder = [
      'FROM node:18-alpine AS deps',
      'FROM node:18-alpine AS builder',
      'FROM node:18-alpine AS runner'
    ];

    let lastIndex = -1;
    stageOrder.forEach(stage => {
      const currentIndex = result.indexOf(stage);
      expect(currentIndex).toBeGreaterThan(lastIndex);
      lastIndex = currentIndex;
    });
  });
});
