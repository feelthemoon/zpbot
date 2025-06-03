import { Context } from 'telegraf';

export interface SessionData {
  expectingSalary?: boolean;
}
 
export interface BotContext extends Context {
  session?: SessionData;
}
