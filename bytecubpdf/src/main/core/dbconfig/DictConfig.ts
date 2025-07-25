import { VERSION } from '@/shared/constants/dfconstants';
class DictConfig{
   dbVersionKey = 'db_version'
   currentDbVersionValue = VERSION.buildNumber
}
export const dictConfig = new DictConfig()