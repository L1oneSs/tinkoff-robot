/**
 * Минимальный тест для диагностики
 */

console.log('Starting minimal test...');

async function main() {
  try {
    console.log('Importing config...');
    const { config } = await import('../src/config.js');
    console.log('Config imported successfully, strategies:', config.strategies?.length || 0);
    
    console.log('Importing Robot...');
    const { Robot } = await import('../src/robot.js');
    console.log('Robot imported successfully');
    
    console.log('Importing API...');
    const { api } = await import('./init-api.js');
    console.log('API imported successfully');
    
    console.log('Creating robot instance...');
    const robot = new Robot(api, {
      ...config,
      useRealAccount: true,
      dryRun: true,
      enableNotifications: false,
      enableReports: false
    });
    console.log('Robot created successfully');
    
    console.log('Testing robot.runOnce()...');
    await robot.runOnce();
    console.log('Robot.runOnce() completed successfully');
    
  } catch (error) {
    console.error('Error in minimal test:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main().then(() => {
  console.log('Minimal test completed successfully');
}).catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});

export {};
