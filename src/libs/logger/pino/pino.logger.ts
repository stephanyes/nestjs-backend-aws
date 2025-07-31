import { pino } from 'pino';
import { pinoOptions } from './options/pino.options';
const logger = pino(pinoOptions);
// const logger = pino();
export default logger;
