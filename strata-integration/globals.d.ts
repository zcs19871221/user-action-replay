declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    // https://github.freewheel.tv/OneStrata/Platform/blob/dev/MediaModule/Jenkinsfile_S3#L15
    readonly ENVIRONMENT:
      | 'local'
      | 'QA'
      | 'Demo'
      | 'Test'
      | 'UAT'
      | 'SIT'
      | 'Production';
  }
}

interface Window {
  sendLogs: (message: string, stack: string) => void;
}
