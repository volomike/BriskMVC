import path from 'path';

export function startServer(app, { BASEPATH, config }) {
  app.listen({
    port: config.PORT || 3000
  });
  
  // ANSI TERMINAL CODES
  const CLRSCN = "\x1b[2J\x1b[H";
  const BOLD = "\x1b[1m";
  const UNBOLD = "\x1b[0m";

  console.log(
    `${CLRSCN}${BOLD}BriskMVC (${path.basename(BASEPATH)}) for BunJS running on port ` +
      (config.PORT || 3000) + `...${UNBOLD}`
  );
  
}
