import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const emailMap: Record<string, string> = {
  'ALINE': 'aline@email.com', 'ALÊ': 'ale@email.com', 'BONA': 'bona@email.com',
  'CARLOS': 'carlos@email.com', 'CHINA': 'china@email.com', 'CHRISTIAN': 'christian@email.com',
  'CID': 'cid@email.com', 'DU': 'du@email.com', 'EDSON': 'edson@email.com',
  'EVERTON': 'everton@email.com', 'EZEQUIAS': 'ezequias@email.com', 'GIULIA': 'giulia@email.com',
  'GUILHERME': 'guilherme@email.com', 'GUSTAVO': 'gustavo@email.com', 'JANICE': 'janice@email.com',
  'JOAO GABRIEL': 'joaogabriel@email.com', 'LUIZ': 'luiz@email.com', 'LUKINHA': 'lukinha@email.com',
  'MURILO': 'murilo@email.com', 'NICELIO': 'nicelio@email.com', 'SAMUEL': 'samuel@email.com',
  'STEFAN': 'stefan@email.com', 'THIAGO': 'thiago@email.com', 'ULYSSES': 'ulysses@email.com',
  'MARCOS': 'marcos@email.com', 'MATHEUS': 'matheus@email.com',
};

const fullNameMap: Record<string, string> = {
  'ALINE': 'Aline', 'ALÊ': 'Alê', 'BONA': 'Bona', 'CARLOS': 'Carlos',
  'CHINA': 'China', 'CHRISTIAN': 'Christian', 'CID': 'Cid', 'DU': 'Du',
  'EDSON': 'Edson', 'EVERTON': 'Everton', 'EZEQUIAS': 'Ezequias', 'GIULIA': 'Giulia',
  'GUILHERME': 'Guilherme', 'GUSTAVO': 'Gustavo', 'JANICE': 'Janice',
  'JOAO GABRIEL': 'João Gabriel', 'LUIZ': 'Luiz', 'LUKINHA': 'Lukinha',
  'MURILO': 'Murilo', 'NICELIO': 'Nicélio', 'SAMUEL': 'Samuel', 'STEFAN': 'Stefan',
  'THIAGO': 'Thiago', 'ULYSSES': 'Ulysses', 'MARCOS': 'Marcos', 'MATHEUS': 'Matheus',
};

const monthMap: Record<string, number> = {
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
};

// Raw spreadsheet data: [month, round, date/hora, player, set1, set2, set3, tabela, desafio]
type Row = [string, string, string, string, string, string, string, string, string];

const DATA: Row[] = [
  // Rodada 01
  ['02/2026','Rodada 01','6-fev.','MURILO','6','6','','1',''],
  ['02/2026','Rodada 01','17:30','JOAO GABRIEL','0','0','','1',''],
  ['02/2026','Rodada 01','10-fev.','JANICE','3','6','6','1',''],
  ['02/2026','Rodada 01','8:30','ULYSSES','6','4','3','1',''],
  ['02/2026','Rodada 01','2-fev.','GUSTAVO','6','7','','1',''],
  ['02/2026','Rodada 01','18:00','LUIZ','3','5','','1',''],
  ['02/2026','Rodada 01','6-mar.','GIULIA','7','3','2','1',''],
  ['02/2026','Rodada 01','20:00','CHINA','5','6','6','1',''],
  ['02/2026','Rodada 01','11-fev.','EZEQUIAS','2','3','','1',''],
  ['02/2026','Rodada 01','18:00','CHRISTIAN','6','6','','1',''],
  ['02/2026','Rodada 01','14-fev.','NICELIO','0','2','','1',''],
  ['02/2026','Rodada 01','8:30','EVERTON','6','6','','1',''],
  ['02/2026','Rodada 01','4-fev.','STEFAN','3','1','','1',''],
  ['02/2026','Rodada 01','20:00','CID','6','6','','1',''],
  ['02/2026','Rodada 01','28-fev.','THIAGO','2','6','6','1',''],
  ['02/2026','Rodada 01','16:00','EDSON','6','0','1','1',''],
  ['02/2026','Rodada 01','6-fev.','GUILHERME','0','1','','1',''],
  ['02/2026','Rodada 01','16:00','ALÊ','6','6','','1',''],
  ['02/2026','Rodada 01','6-fev.','BONA','5','3','','1',''],
  ['02/2026','Rodada 01','18:30','ALINE','7','6','','1',''],
  ['02/2026','Rodada 01','17-fev.','SAMUEL','2','6','2','1',''],
  ['02/2026','Rodada 01','17:00','DU','6','3','6','1',''],
  ['02/2026','Rodada 01','8-fev.','CARLOS','7','6','','1',''],
  ['02/2026','Rodada 01','16:30','LUKINHA','6','1','','1',''],
  // Rodada 02
  ['02/2026','Rodada 02','24-mar.','MURILO','7','6','','1',''],
  ['02/2026','Rodada 02','18:30','CID','5','2','','1',''],
  ['02/2026','Rodada 02','7-fev.','STEFAN','2','4','','1',''],
  ['02/2026','Rodada 02','8:00','EDSON','6','6','','1',''],
  ['02/2026','Rodada 02','16-fev.','THIAGO','6','6','','1',''],
  ['02/2026','Rodada 02','18:00','ALÊ','2','2','','1',''],
  ['02/2026','Rodada 02','20-fev.','GUILHERME','1','0','','1',''],
  ['02/2026','Rodada 02','18:30','ALINE','6','6','','1',''],
  ['02/2026','Rodada 02','ADIAMENTO','BONA','4','2','','1',''],
  ['02/2026','Rodada 02','Jogar até 31/03','DU','6','6','','1',''],
  ['02/2026','Rodada 02','5-fev.','SAMUEL','6','6','','1',''],
  ['02/2026','Rodada 02','18:30','LUKINHA','1','1','','1',''],
  ['02/2026','Rodada 02','5-fev.','JOAO GABRIEL','0','2','','1',''],
  ['02/2026','Rodada 02','8:30','ULYSSES','6','6','','1',''],
  ['02/2026','Rodada 02','13-fev.','JANICE','6','6','','1',''],
  ['02/2026','Rodada 02','9:00','LUIZ','1','0','','1',''],
  ['02/2026','Rodada 02','20-mar.','GUSTAVO','7','6','','1',''],
  ['02/2026','Rodada 02','19:00','CHINA','5','3','','1',''],
  ['02/2026','Rodada 02','28-fev.','GIULIA','0','2','','1',''],
  ['02/2026','Rodada 02','7:00','CHRISTIAN','6','6','','1',''],
  ['02/2026','Rodada 02','21-fev.','EZEQUIAS','3','4','','1',''],
  ['02/2026','Rodada 02','7:30','EVERTON','6','6','','1',''],
  ['02/2026','Rodada 02','15-fev.','NICELIO','0','0','','1',''],
  ['02/2026','Rodada 02','15:30','CARLOS','6','6','','1',''],
  // Rodada 03
  ['02/2026','Rodada 03','21-fev.','MURILO','6','6','','1',''],
  ['02/2026','Rodada 03','7:30','ULYSSES','3','1','','1',''],
  ['02/2026','Rodada 03','','JOAO GABRIEL','1','1','','1',''],
  ['02/2026','Rodada 03','','LUIZ','6','6','','1',''],
  ['02/2026','Rodada 03','31-mar.','JANICE','6','7','','1',''],
  ['02/2026','Rodada 03','19:30','CHINA','1','5','','1',''],
  ['02/2026','Rodada 03','18-fev.','GUSTAVO','2','0','','1',''],
  ['02/2026','Rodada 03','18:30','CHRISTIAN','6','6','','1',''],
  ['02/2026','Rodada 03','28-fev.','GIULIA','5','4','','1',''],
  ['02/2026','Rodada 03','16:00','EVERTON','7','6','','1',''],
  ['02/2026','Rodada 03','13-fev.','EZEQUIAS','3','3','','1',''],
  ['02/2026','Rodada 03','7:00','CARLOS','6','6','','1',''],
  ['02/2026','Rodada 03','','CID','3','5','','1',''],
  ['02/2026','Rodada 03','','EDSON','6','7','','1',''],
  ['02/2026','Rodada 03','21-fev.','STEFAN','2','2','','1',''],
  ['02/2026','Rodada 03','7:00','ALÊ','6','6','','1',''],
  ['02/2026','Rodada 03','CHUVA','THIAGO','6','6','6','1',''],
  ['02/2026','Rodada 03','Jogar até 24/03','ALINE','7','0','3','1',''],
  ['02/2026','Rodada 03','13-fev.','GUILHERME','4','2','','1',''],
  ['02/2026','Rodada 03','18:30','DU','6','6','','1',''],
  ['02/2026','Rodada 03','26-fev.','BONA','0','0','','1',''],
  ['02/2026','Rodada 03','19:00','LUKINHA','6','6','','1',''],
  ['02/2026','Rodada 03','7-fev.','SAMUEL','6','6','','1',''],
  ['02/2026','Rodada 03','16:30','NICELIO','1','0','','1',''],
  // Rodada 04
  ['03/2026','Rodada 04','','MURILO','6','2','','1',''],
  ['03/2026','Rodada 04','','EDSON','7','6','','1',''],
  ['03/2026','Rodada 04','','CID','2','4','','1',''],
  ['03/2026','Rodada 04','','ALÊ','6','6','','1',''],
  ['03/2026','Rodada 04','','STEFAN','7','6','','1',''],
  ['03/2026','Rodada 04','','ALINE','6','4','','1',''],
  ['03/2026','Rodada 04','','THIAGO','6','6','','1',''],
  ['03/2026','Rodada 04','','DU','4','4','','1',''],
  ['03/2026','Rodada 04','','GUILHERME','4','2','','1',''],
  ['03/2026','Rodada 04','','LUKINHA','6','6','','1',''],
  ['03/2026','Rodada 04','22-mar.','BONA','6','6','','1',''],
  ['03/2026','Rodada 04','10:00','NICELIO','3','0','','1',''],
  ['03/2026','Rodada 04','','ULYSSES','6','6','','1',''],
  ['03/2026','Rodada 04','','LUIZ','2','2','','1',''],
  ['03/2026','Rodada 04','','JOAO GABRIEL','1','0','','1',''],
  ['03/2026','Rodada 04','','CHINA','6','6','','1',''],
  ['03/2026','Rodada 04','18-mar.','JANICE','5','6','','1',''],
  ['03/2026','Rodada 04','18:00','CHRISTIAN','7','7','','1',''],
  ['03/2026','Rodada 04','','GUSTAVO','6','6','','1',''],
  ['03/2026','Rodada 04','','EVERTON','4','4','','1',''],
  ['03/2026','Rodada 04','27-mar.','GIULIA','0','0','','1',''],
  ['03/2026','Rodada 04','6:30','CARLOS','6','6','','1',''],
  ['03/2026','Rodada 04','','EZEQUIAS','2','7','2','1',''],
  ['03/2026','Rodada 04','','SAMUEL','6','6','6','1',''],
  // Rodada 05
  ['03/2026','Rodada 05','','MURILO','6','6','','1',''],
  ['03/2026','Rodada 05','','LUIZ','0','0','','1',''],
  ['03/2026','Rodada 05','26-abr.','ULYSSES','4','6','','1',''],
  ['03/2026','Rodada 05','7:00','CHINA','6','7','','1',''],
  ['03/2026','Rodada 05','25-mar.','JOAO GABRIEL','0','0','','1',''],
  ['03/2026','Rodada 05','20:00','CHRISTIAN','6','6','','1',''],
  ['03/2026','Rodada 05','','JANICE','6','6','','1',''],
  ['03/2026','Rodada 05','','EVERTON','2','1','','1',''],
  ['03/2026','Rodada 05','','GUSTAVO','6','4','6','1',''],
  ['03/2026','Rodada 05','','CARLOS','4','6','7','1',''],
  ['03/2026','Rodada 05','25-mar.','GIULIA','1','4','','1',''],
  ['03/2026','Rodada 05','18:30','SAMUEL','6','6','','1',''],
  ['03/2026','Rodada 05','4-abr.','EDSON','6','7','','1',''],
  ['03/2026','Rodada 05','7:30','ALÊ','2','6','','1',''],
  ['03/2026','Rodada 05','30-mar.','CID','3','1','','1',''],
  ['03/2026','Rodada 05','18:30','ALINE','6','6','','1',''],
  ['03/2026','Rodada 05','W.O.','STEFAN','W.O.','','','1',''],
  ['03/2026','Rodada 05','W.O.','DU','W.O.','','','1',''],
  ['03/2026','Rodada 05','Chuva','THIAGO','6','6','','1',''],
  ['03/2026','Rodada 05','Jogar até 15/04','LUKINHA','2','2','','1',''],
  ['03/2026','Rodada 05','ADIAMENTO','GUILHERME','6','4','3','1',''],
  ['03/2026','Rodada 05','Jogar até 30/04','NICELIO','2','6','6','1',''],
  ['03/2026','Rodada 05','17-mar.','BONA','3','4','','1',''],
  ['03/2026','Rodada 05','18:30','EZEQUIAS','6','6','','1',''],
  // Rodada 06
  ['03/2026','Rodada 06','','MURILO','6','6','6','1',''],
  ['03/2026','Rodada 06','','ALÊ','3','7','1','1',''],
  ['03/2026','Rodada 06','','EDSON','7','6','6','1',''],
  ['03/2026','Rodada 06','','ALINE','5','7','2','1',''],
  ['03/2026','Rodada 06','29-mai.','CID','2','2','','1',''],
  ['03/2026','Rodada 06','19:00','DU','6','6','','1',''],
  ['03/2026','Rodada 06','15-mar.','STEFAN','3','6','6','1',''],
  ['03/2026','Rodada 06','19:00','LUKINHA','6','4','1','1',''],
  ['03/2026','Rodada 06','','THIAGO','6','6','','1',''],
  ['03/2026','Rodada 06','','NICELIO','1','2','','1',''],
  ['03/2026','Rodada 06','','GUILHERME','3','3','','1',''],
  ['03/2026','Rodada 06','','EZEQUIAS','6','6','','1',''],
  ['03/2026','Rodada 06','','LUIZ','2','0','','1',''],
  ['03/2026','Rodada 06','','CHINA','6','6','','1',''],
  ['03/2026','Rodada 06','','ULYSSES','6','1','2','1',''],
  ['03/2026','Rodada 06','','CHRISTIAN','4','6','6','1',''],
  ['03/2026','Rodada 06','22-mar.','JOAO GABRIEL','3','2','','1',''],
  ['03/2026','Rodada 06','16:30','EVERTON','6','6','','1',''],
  ['03/2026','Rodada 06','','JANICE','6','6','','1',''],
  ['03/2026','Rodada 06','','CARLOS','0','0','','1',''],
  ['03/2026','Rodada 06','16-mar.','GUSTAVO','6','6','2','1',''],
  ['03/2026','Rodada 06','19:00','SAMUEL','7','4','6','1',''],
  ['03/2026','Rodada 06','20-mar.','GIULIA','6','6','','1',''],
  ['03/2026','Rodada 06','17:00','BONA','4','3','','1',''],
  // Rodada 07
  ['04/2026','Rodada 07','23-abr.','MURILO','6','7','','1',''],
  ['04/2026','Rodada 07','19:30','CHINA','2','5','','1',''],
  ['04/2026','Rodada 07','','LUIZ','0','2','','1',''],
  ['04/2026','Rodada 07','','CHRISTIAN','6','6','','1',''],
  ['04/2026','Rodada 07','','ULYSSES','4','4','','1',''],
  ['04/2026','Rodada 07','','EVERTON','6','6','','1',''],
  ['04/2026','Rodada 07','21-abr.','JOAO GABRIEL','0','0','','1',''],
  ['04/2026','Rodada 07','6:30','CARLOS','6','6','','1',''],
  ['04/2026','Rodada 07','','JANICE','6','6','','1',''],
  ['04/2026','Rodada 07','','SAMUEL','3','3','','1',''],
  ['04/2026','Rodada 07','','GUSTAVO','6','6','','1',''],
  ['04/2026','Rodada 07','','BONA','1','1','','1',''],
  ['04/2026','Rodada 07','','ALÊ','6','6','','1',''],
  ['04/2026','Rodada 07','','ALINE','4','4','','1',''],
  ['04/2026','Rodada 07','','EDSON','6','6','','1',''],
  ['04/2026','Rodada 07','','DU','4','2','','1',''],
  ['04/2026','Rodada 07','21-abr.','CID','6','4','5','1',''],
  ['04/2026','Rodada 07','16:30','LUKINHA','4','6','7','1',''],
  ['04/2026','Rodada 07','','STEFAN','6','6','','1',''],
  ['04/2026','Rodada 07','','NICELIO','1','3','','1',''],
  ['04/2026','Rodada 07','','THIAGO','6','6','','1',''],
  ['04/2026','Rodada 07','','EZEQUIAS','4','4','','1',''],
  // Desafio DU vs CHINA
  ['04/2026','DESAFIANTE','','DU','7','6','6','','1'],
  ['04/2026','DESAFIADO','','CHINA','6','1','4','','1'],
  // Rodada 07 continued
  ['04/2026','Rodada 07','20-abr.','GUILHERME','2','4','','1',''],
  ['04/2026','Rodada 07','17:00','GIULIA','6','6','','1',''],
  // Rodada 08
  ['04/2026','Rodada 08','30-abr.','MURILO','7','6','','1',''],
  ['04/2026','Rodada 08','17:00','ALINE','5','2','','1',''],
  ['04/2026','Rodada 08','','ALÊ','1','4','','1',''],
  ['04/2026','Rodada 08','','DU','4','6','','1',''],
  ['04/2026','Rodada 08','','EDSON','7','6','','1',''],
  ['04/2026','Rodada 08','','LUKINHA','6','2','','1',''],
  ['04/2026','Rodada 08','31-mai.','CID','6','6','','1',''],
  ['04/2026','Rodada 08','7:00','NICELIO','1','2','','1',''],
  ['04/2026','Rodada 08','','STEFAN','6','1','6','1',''],
  ['04/2026','Rodada 08','','EZEQUIAS','2','6','3','1',''],
  ['04/2026','Rodada 08','24-abr.','THIAGO','6','6','','1',''],
  ['04/2026','Rodada 08','18:30','GIULIA','2','2','','1',''],
  ['04/2026','Rodada 08','','CHINA','1','2','','1',''],
  ['04/2026','Rodada 08','','CHRISTIAN','6','6','','1',''],
  ['04/2026','Rodada 08','','LUIZ','3','5','','1',''],
  ['04/2026','Rodada 08','','EVERTON','6','7','','1',''],
  ['04/2026','Rodada 08','','ULYSSES','2','6','7','1',''],
  ['04/2026','Rodada 08','','CARLOS','6','3','5','1',''],
  ['04/2026','Rodada 08','','JOAO GABRIEL','1','0','','1',''],
  ['04/2026','Rodada 08','','SAMUEL','6','6','','1',''],
  ['04/2026','Rodada 08','24-abr.','JANICE','6','6','','1',''],
  ['04/2026','Rodada 08','17:00','BONA','0','0','','1',''],
  ['04/2026','Rodada 08','30-abr.','GUSTAVO','6','6','','1',''],
  ['04/2026','Rodada 08','21:00','GUILHERME','0','0','','1',''],
  // Rodada 09
  ['04/2026','Rodada 09','','MURILO','1','2','','1',''],
  ['04/2026','Rodada 09','','CHRISTIAN','6','6','','1',''],
  ['04/2026','Rodada 09','','CHINA','5','3','','1',''],
  ['04/2026','Rodada 09','','EVERTON','7','6','','1',''],
  ['04/2026','Rodada 09','','LUIZ','0','0','','1',''],
  ['04/2026','Rodada 09','','CARLOS','6','6','','1',''],
  ['04/2026','Rodada 09','','ULYSSES','5','6','7','1',''],
  ['04/2026','Rodada 09','','SAMUEL','7','3','6','1',''],
  ['04/2026','Rodada 09','28-abr.','JOAO GABRIEL','1','0','','1',''],
  ['04/2026','Rodada 09','16:00','BONA','6','6','','1',''],
  ['04/2026','Rodada 09','','JANICE','6','6','','1',''],
  ['04/2026','Rodada 09','','GUILHERME','0','0','','1',''],
  ['04/2026','Rodada 09','29-abr.','ALINE','5','1','','1',''],
  ['04/2026','Rodada 09','19:00','DU','7','6','','1',''],
  ['04/2026','Rodada 09','25-abr.','ALÊ','6','6','6','1',''],
  ['04/2026','Rodada 09','16:00','LUKINHA','3','7','3','1',''],
  ['04/2026','Rodada 09','','EDSON','6','6','','1',''],
  ['04/2026','Rodada 09','','NICELIO','0','0','','1',''],
  ['04/2026','Rodada 09','','CID','5','3','','1',''],
  ['04/2026','Rodada 09','','EZEQUIAS','7','6','','1',''],
  ['04/2026','Rodada 09','22-abr.','STEFAN','6','6','','1',''],
  ['04/2026','Rodada 09','19:00','GIULIA','0','2','','1',''],
  ['04/2026','Rodada 09','27-abr.','THIAGO','6','6','','1',''],
  ['04/2026','Rodada 09','19:30','GUSTAVO','2','4','','1',''],
  // Rodada 10
  ['05/2026','Rodada 10','28-mai.','MURILO','3','6','2','1',''],
  ['05/2026','Rodada 10','19:00','DU','6','1','6','1',''],
  ['05/2026','Rodada 10','','ALINE','6','6','6','1',''],
  ['05/2026','Rodada 10','','LUKINHA','4','7','1','1',''],
  ['05/2026','Rodada 10','','ALÊ','6','6','','1',''],
  ['05/2026','Rodada 10','','NICELIO','1','1','','1',''],
  ['05/2026','Rodada 10','','EDSON','6','6','','1',''],
  ['05/2026','Rodada 10','','EZEQUIAS','2','2','','1',''],
  ['05/2026','Rodada 10','Adiamento','CID','6','6','','1',''],
  ['05/2026','Rodada 10','Até 30/06','GIULIA','1','2','','1',''],
  ['05/2026','Rodada 10','','STEFAN','2','2','','1',''],
  ['05/2026','Rodada 10','','GUSTAVO','6','6','','1',''],
  ['05/2026','Rodada 10','22-mai.','CHRISTIAN','6','6','','1',''],
  ['05/2026','Rodada 10','20:00','EVERTON','1','1','','1',''],
  ['05/2026','Rodada 10','','CHINA','5','7','7','1',''],
  ['05/2026','Rodada 10','','CARLOS','7','6','5','1',''],
  ['05/2026','Rodada 10','','LUIZ','1','2','','1',''],
  ['05/2026','Rodada 10','','SAMUEL','6','6','','1',''],
  ['05/2026','Rodada 10','','ULYSSES','6','6','','1',''],
  ['05/2026','Rodada 10','','BONA','2','4','','1',''],
  ['05/2026','Rodada 10','','JOAO GABRIEL','6','6','','1',''],
  ['05/2026','Rodada 10','','GUILHERME','2','4','','1',''],
  ['05/2026','Rodada 10','','JANICE','6','2','5','1',''],
  ['05/2026','Rodada 10','','THIAGO','4','6','7','1',''],
  // Rodada 11
  ['05/2026','Rodada 11','27-jul.','MURILO','','','','0',''],
  ['05/2026','Rodada 11','18:00','EVERTON','','','','0',''],
  ['05/2026','Rodada 11','27-mai.','CHRISTIAN','6','6','','1',''],
  ['05/2026','Rodada 11','20:00','CARLOS','2','1','','1',''],
  ['05/2026','Rodada 11','','CHINA','6','2','3','1',''],
  ['05/2026','Rodada 11','','SAMUEL','4','6','6','1',''],
  ['05/2026','Rodada 11','21-mai.','LUIZ','6','3','6','1',''],
  ['05/2026','Rodada 11','17:00','BONA','3','6','4','1',''],
  ['05/2026','Rodada 11','22-mai.','ULYSSES','6','6','6','1',''],
  ['05/2026','Rodada 11','16:30','MARCOS','4','7','2','1',''],
  ['05/2026','Rodada 11','','JOAO GABRIEL','1','2','','1',''],
  ['05/2026','Rodada 11','','THIAGO','6','6','','1',''],
  ['05/2026','Rodada 11','21-mai.','DU','6','6','','1',''],
  ['05/2026','Rodada 11','19:00','LUKINHA','1','3','','1',''],
  ['05/2026','Rodada 11','','ALINE','6','6','','1',''],
  ['05/2026','Rodada 11','','NICELIO','0','1','','1',''],
  ['05/2026','Rodada 11','','ALÊ','6','2','6','1',''],
  ['05/2026','Rodada 11','','EZEQUIAS','2','6','2','1',''],
  ['05/2026','Rodada 11','','EDSON','7','6','','1',''],
  ['05/2026','Rodada 11','','GIULIA','6','1','','1',''],
  ['05/2026','Rodada 11','','CID','3','4','','1',''],
  ['05/2026','Rodada 11','','GUSTAVO','6','6','','1',''],
  ['05/2026','Rodada 11','Adiamento','STEFAN','2','4','','1',''],
  ['05/2026','Rodada 11','Até 30/06','JANICE','6','6','','1',''],
  // Rodada 12
  ['05/2026','Rodada 12','','MURILO','3','6','6','1',''],
  ['05/2026','Rodada 12','','LUKINHA','6','0','2','1',''],
  ['05/2026','Rodada 12','Adiamento','DU','6','6','','1',''],
  ['05/2026','Rodada 12','Até 30/06','NICELIO','4','0','','1',''],
  ['05/2026','Rodada 12','26-mai.','ALINE','6','6','6','1',''],
  ['05/2026','Rodada 12','19:30','EZEQUIAS','7','2','4','1',''],
  ['05/2026','Rodada 12','W.O.','ALÊ','W.O.','','','1',''],
  ['05/2026','Rodada 12','W.O.','GIULIA','W.O.','','','',''],
  ['05/2026','Rodada 12','','EDSON','6','6','5','1',''],
  ['05/2026','Rodada 12','','GUSTAVO','2','7','7','1',''],
  ['05/2026','Rodada 12','31-mai.','CID','2','1','','1',''],
  ['05/2026','Rodada 12','17:00','JANICE','6','6','','1',''],
  ['05/2026','Rodada 12','','EVERTON','1','6','6','1',''],
  ['05/2026','Rodada 12','','CARLOS','6','3','4','1',''],
  ['05/2026','Rodada 12','','CHRISTIAN','6','6','','1',''],
  ['05/2026','Rodada 12','','SAMUEL','1','1','','1',''],
  ['05/2026','Rodada 12','24-mai.','CHINA','7','6','','1',''],
  ['05/2026','Rodada 12','17:30','BONA','5','0','','1',''],
  ['05/2026','Rodada 12','25-mai.','LUIZ','1','6','3','1',''],
  ['05/2026','Rodada 12','16:00','MARCOS','6','3','6','1',''],
  ['05/2026','Rodada 12','','ULYSSES','1','4','','1',''],
  ['05/2026','Rodada 12','','THIAGO','6','6','','1',''],
  ['05/2026','Rodada 12','27-mai.','JOAO GABRIEL','1','2','','1',''],
  ['05/2026','Rodada 12','18:20','STEFAN','6','6','','1',''],
  // Rodada 13
  ['06/2026','Rodada 13','Chuva','MURILO','6','6','','1',''],
  ['06/2026','Rodada 13','Jogar até 07/07','CARLOS','4','4','','1',''],
  ['06/2026','Rodada 13','24-jun.','EVERTON','0','6','6','1',''],
  ['06/2026','Rodada 13','8:00','SAMUEL','6','3','7','1',''],
  ['06/2026','Rodada 13','','CHRISTIAN','6','6','','1',''],
  ['06/2026','Rodada 13','','BONA','1','0','','1',''],
  ['06/2026','Rodada 13','','CHINA','7','0','0','1',''],
  ['06/2026','Rodada 13','','MARCOS','5','6','6','1',''],
  ['06/2026','Rodada 13','','LUIZ','2','0','','1',''],
  ['06/2026','Rodada 13','','THIAGO','6','6','','1',''],
  ['06/2026','Rodada 13','','ULYSSES','6','6','','1',''],
  ['06/2026','Rodada 13','','STEFAN','3','4','','1',''],
  ['06/2026','Rodada 13','','LUKINHA','6','6','','1',''],
  ['06/2026','Rodada 13','','NICELIO','1','1','','1',''],
  ['06/2026','Rodada 13','28-jun.','DU','6','6','4','1',''],
  ['06/2026','Rodada 13','16:00','EZEQUIAS','7','4','6','1',''],
  ['06/2026','Rodada 13','W.O.','ALINE','W.O.','','','1',''],
  ['06/2026','Rodada 13','W.O.','GIULIA','W.O.','','','',''],
  ['06/2026','Rodada 13','','ALÊ','6','2','','1',''],
  ['06/2026','Rodada 13','','GUSTAVO','7','6','','1',''],
  ['06/2026','Rodada 13','Adiamento','EDSON','3','5','','1',''],
  ['06/2026','Rodada 13','Até 31/07','JANICE','6','7','','1',''],
  ['06/2026','Rodada 13','30-jun.','CID','6','6','','1',''],
  ['06/2026','Rodada 13','20:00','JOAO GABRIEL','1','1','','1',''],
  // Rodada 14
  ['06/2026','Rodada 14','Adiamento','MURILO','','','','0',''],
  ['06/2026','Rodada 14','Até 31/07','NICELIO','','','','0',''],
  ['06/2026','Rodada 14','','LUKINHA','4','6','6','1',''],
  ['06/2026','Rodada 14','','EZEQUIAS','6','1','0','1',''],
  ['06/2026','Rodada 14','W.O.','DU','W.O.','','','1',''],
  ['06/2026','Rodada 14','W.O.','GIULIA','W.O.','','','',''],
  ['06/2026','Rodada 14','','ALINE','5','4','','1',''],
  ['06/2026','Rodada 14','','GUSTAVO','7','6','','1',''],
  ['06/2026','Rodada 14','','ALÊ','1','1','','1',''],
  ['06/2026','Rodada 14','','JANICE','6','6','','1',''],
  ['06/2026','Rodada 14','Adiamento','EDSON','6','6','','1',''],
  ['06/2026','Rodada 14','Até 31/07','JOAO GABRIEL','3','0','','1',''],
  ['06/2026','Rodada 14','29-jun.','CARLOS','6','3','0','1',''],
  ['06/2026','Rodada 14','20:00','SAMUEL','3','6','6','1',''],
  ['06/2026','Rodada 14','','EVERTON','6','6','','1',''],
  ['06/2026','Rodada 14','','BONA','1','1','','1',''],
  ['06/2026','Rodada 14','','CHRISTIAN','6','6','','1',''],
  ['06/2026','Rodada 14','','MARCOS','1','0','','1',''],
  ['06/2026','Rodada 14','','CHINA','1','2','','1',''],
  ['06/2026','Rodada 14','','THIAGO','6','6','','1',''],
  ['06/2026','Rodada 14','','LUIZ','3','6','','1',''],
  ['06/2026','Rodada 14','','STEFAN','6','7','','1',''],
  ['06/2026','Rodada 14','Adiamento','ULYSSES','7','6','6','1',''],
  ['06/2026','Rodada 14','Até 31/07','CID','5','7','0','1',''],
  // Rodada 15
  ['06/2026','Rodada 15','','MURILO','6','2','7','1',''],
  ['06/2026','Rodada 15','','SAMUEL','4','6','5','1',''],
  ['06/2026','Rodada 15','26-jun.','CARLOS','6','6','','1',''],
  ['06/2026','Rodada 15','19:15','BONA','1','0','','1',''],
  ['06/2026','Rodada 15','25-jul.','EVERTON','6','6','','1',''],
  ['06/2026','Rodada 15','8:15','MARCOS','2','4','','1',''],
  ['06/2026','Rodada 15','1-jul.','CHRISTIAN','6','3','6','1',''],
  ['06/2026','Rodada 15','19:15','THIAGO','4','6','4','1',''],
  ['06/2026','Rodada 15','27-jun.','CHINA','6','6','','1',''],
  ['06/2026','Rodada 15','16:00','STEFAN','0','3','','1',''],
  ['06/2026','Rodada 15','26-jun.','LUIZ','6','1','','1',''],
  ['06/2026','Rodada 15','16:15','CID','7','6','','1',''],
  ['06/2026','Rodada 15','','NICELIO','2','2','','1',''],
  ['06/2026','Rodada 15','','EZEQUIAS','6','6','','1',''],
  ['06/2026','Rodada 15','W.O.','LUKINHA','W.O.','','','1',''],
  ['06/2026','Rodada 15','W.O.','GIULIA','W.O.','','','',''],
  ['06/2026','Rodada 15','','DU','6','2','7','1',''],
  ['06/2026','Rodada 15','','GUSTAVO','2','6','6','1',''],
  ['06/2026','Rodada 15','30-jun.','ALINE','0','0','','1',''],
  ['06/2026','Rodada 15','18:00','JANICE','6','6','','1',''],
  ['06/2026','Rodada 15','28-jun.','ALÊ','6','6','','1',''],
  ['06/2026','Rodada 15','7:30','JOAO GABRIEL','3','2','','1',''],
  ['06/2026','Rodada 15','','EDSON','6','6','','1',''],
  ['06/2026','Rodada 15','','ULYSSES','4','2','','1',''],
  // Rodada 16
  ['07/2026','Rodada 16','','MURILO','6','6','','1',''],
  ['07/2026','Rodada 16','','EZEQUIAS','2','3','','1',''],
  ['07/2026','Rodada 16','','NICELIO','','','','0',''],
  ['07/2026','Rodada 16','','MATHEUS','','','','0',''],
  ['07/2026','Rodada 16','','LUKINHA','7','6','','1',''],
  ['07/2026','Rodada 16','','GUSTAVO','5','4','','1',''],
  ['07/2026','Rodada 16','','DU','4','4','','1',''],
  ['07/2026','Rodada 16','','JANICE','6','6','','1',''],
  ['07/2026','Rodada 16','','ALINE','6','6','','1',''],
  ['07/2026','Rodada 16','','JOAO GABRIEL','1','1','','1',''],
  ['07/2026','Rodada 16','','ALÊ','6','4','','1',''],
  ['07/2026','Rodada 16','','ULYSSES','7','6','','1',''],
  ['07/2026','Rodada 16','','SAMUEL','','','','0',''],
  ['07/2026','Rodada 16','','BONA','','','','0',''],
  ['07/2026','Rodada 16','27-jul.','CARLOS','','','','0',''],
  ['07/2026','Rodada 16','20:00','MARCOS','','','','0',''],
  ['07/2026','Rodada 16','','EVERTON','3','3','','1',''],
  ['07/2026','Rodada 16','','THIAGO','6','6','','1',''],
  ['07/2026','Rodada 16','29-jul.','CHRISTIAN','','','','0',''],
  ['07/2026','Rodada 16','20:00','STEFAN','','','','0',''],
  ['07/2026','Rodada 16','','CHINA','3','6','6','1',''],
  ['07/2026','Rodada 16','','CID','6','3','4','1',''],
  ['07/2026','Rodada 16','','LUIZ','3','2','','1',''],
  ['07/2026','Rodada 16','','EDSON','6','6','','1',''],
  // Rodada 17
  ['07/2026','Rodada 17','','MURILO','','','','0',''],
  ['07/2026','Rodada 17','','BONA','','','','0',''],
  ['07/2026','Rodada 17','','SAMUEL','4','7','7','1',''],
  ['07/2026','Rodada 17','','MARCOS','6','5','5','1',''],
  ['07/2026','Rodada 17','31-jul.','CARLOS','','','','0',''],
  ['07/2026','Rodada 17','20:00','THIAGO','','','','0',''],
  ['07/2026','Rodada 17','','EVERTON','','','','0',''],
  ['07/2026','Rodada 17','','STEFAN','','','','0',''],
  ['07/2026','Rodada 17','22-jul.','CHRISTIAN','6','6','','1',''],
  ['07/2026','Rodada 17','20:00','CID','1','2','','1',''],
  ['07/2026','Rodada 17','','CHINA','6','6','','1',''],
  ['07/2026','Rodada 17','','EDSON','3','1','','1',''],
  ['07/2026','Rodada 17','29-jul.','EZEQUIAS','','','','0',''],
  ['07/2026','Rodada 17','18:30','MATHEUS','','','','0',''],
  ['07/2026','Rodada 17','','NICELIO','2','1','','1',''],
  ['07/2026','Rodada 17','','GUSTAVO','6','6','','1',''],
  ['07/2026','Rodada 17','','LUKINHA','1','3','','1',''],
  ['07/2026','Rodada 17','','JANICE','6','6','','1',''],
  ['07/2026','Rodada 17','','DU','','','','0',''],
  ['07/2026','Rodada 17','','JOAO GABRIEL','','','','0',''],
  ['07/2026','Rodada 17','','ALINE','6','7','','1',''],
  ['07/2026','Rodada 17','','ULYSSES','3','5','','1',''],
  ['07/2026','Rodada 17','25-jul.','ALÊ','7','6','','1',''],
  ['07/2026','Rodada 17','8:15','LUIZ','6','1','','1',''],
  // Rodada 18
  ['07/2026','Rodada 18','','MURILO','6','6','','1',''],
  ['07/2026','Rodada 18','','MATHEUS','0','0','','1',''],
  ['07/2026','Rodada 18','','EZEQUIAS','2','2','','1',''],
  ['07/2026','Rodada 18','','GUSTAVO','6','6','','1',''],
  ['07/2026','Rodada 18','','NICELIO','0','0','','1',''],
  ['07/2026','Rodada 18','','JANICE','6','6','','1',''],
  ['07/2026','Rodada 18','','LUKINHA','W.O.','','','1',''],
  ['07/2026','Rodada 18','','JOAO GABRIEL','W.O.','','','1',''],
  ['07/2026','Rodada 18','','DU','2','2','','1',''],
  ['07/2026','Rodada 18','','ULYSSES','6','6','','1',''],
  ['07/2026','Rodada 18','20-jul.','ALINE','6','6','','1',''],
  ['07/2026','Rodada 18','17:00','LUIZ','1','3','','1',''],
  ['07/2026','Rodada 18','','BONA','2','2','','1',''],
  ['07/2026','Rodada 18','','MARCOS','6','6','','1',''],
  ['07/2026','Rodada 18','','SAMUEL','2','3','','1',''],
  ['07/2026','Rodada 18','','THIAGO','6','6','','1',''],
  ['07/2026','Rodada 18','','CARLOS','6','6','','1',''],
  ['07/2026','Rodada 18','','STEFAN','0','1','','1',''],
  ['07/2026','Rodada 18','26-jul.','EVERTON','','','','0',''],
  ['07/2026','Rodada 18','7:30','CID','','','','0',''],
  ['07/2026','Rodada 18','','CHRISTIAN','6','6','','1',''],
  ['07/2026','Rodada 18','','EDSON','3','0','','1',''],
  ['07/2026','Rodada 18','2-ago.','CHINA','','','','0',''],
  ['07/2026','Rodada 18','7:30','ALÊ','','','','0',''],
  // Rodada 19
  ['08/2026','Rodada 19','','MURILO','','','','0',''],
  ['08/2026','Rodada 19','','MARCOS','','','','0',''],
  ['08/2026','Rodada 19','','BONA','','','','0',''],
  ['08/2026','Rodada 19','','THIAGO','','','','0',''],
  ['08/2026','Rodada 19','','SAMUEL','','','','0',''],
  ['08/2026','Rodada 19','','STEFAN','','','','0',''],
  ['08/2026','Rodada 19','','CARLOS','','','','0',''],
  ['08/2026','Rodada 19','','CID','','','','0',''],
  ['08/2026','Rodada 19','','EVERTON','','','','0',''],
  ['08/2026','Rodada 19','','EDSON','','','','0',''],
  ['08/2026','Rodada 19','','CHRISTIAN','','','','0',''],
  ['08/2026','Rodada 19','','ALÊ','','','','0',''],
  ['08/2026','Rodada 19','','MATHEUS','','','','0',''],
  ['08/2026','Rodada 19','','GUSTAVO','','','','0',''],
  ['08/2026','Rodada 19','','EZEQUIAS','','','','0',''],
  ['08/2026','Rodada 19','','JANICE','','','','0',''],
  ['08/2026','Rodada 19','','NICELIO','','','','0',''],
  ['08/2026','Rodada 19','','JOAO GABRIEL','','','','0',''],
  ['08/2026','Rodada 19','','LUKINHA','','','','0',''],
  ['08/2026','Rodada 19','','ULYSSES','','','','0',''],
  ['08/2026','Rodada 19','','DU','','','','0',''],
  ['08/2026','Rodada 19','','LUIZ','','','','0',''],
  ['08/2026','Rodada 19','','ALINE','','','','0',''],
  ['08/2026','Rodada 19','','CHINA','','','','0',''],
  // Rodada 20
  ['08/2026','Rodada 20','','MURILO','','','','0',''],
  ['08/2026','Rodada 20','','GUSTAVO','','','','0',''],
  ['08/2026','Rodada 20','','MATHEUS','','','','0',''],
  ['08/2026','Rodada 20','','JANICE','','','','0',''],
  ['08/2026','Rodada 20','','EZEQUIAS','','','','0',''],
  ['08/2026','Rodada 20','','JOAO GABRIEL','','','','0',''],
  ['08/2026','Rodada 20','','NICELIO','','','','0',''],
  ['08/2026','Rodada 20','','ULYSSES','','','','0',''],
  ['08/2026','Rodada 20','','LUKINHA','','','','0',''],
  ['08/2026','Rodada 20','','LUIZ','','','','0',''],
  ['08/2026','Rodada 20','','DU','','','','0',''],
  ['08/2026','Rodada 20','','CHINA','','','','0',''],
  ['08/2026','Rodada 20','','MARCOS','','','','0',''],
  ['08/2026','Rodada 20','','THIAGO','','','','0',''],
  ['08/2026','Rodada 20','','BONA','','','','0',''],
  ['08/2026','Rodada 20','','STEFAN','','','','0',''],
  ['08/2026','Rodada 20','','SAMUEL','','','','0',''],
  ['08/2026','Rodada 20','','CID','','','','0',''],
  ['08/2026','Rodada 20','','CARLOS','','','','0',''],
  ['08/2026','Rodada 20','','EDSON','','','','0',''],
  ['08/2026','Rodada 20','','EVERTON','','','','0',''],
  ['08/2026','Rodada 20','','ALÊ','','','','0',''],
  ['08/2026','Rodada 20','','CHRISTIAN','','','','0',''],
  ['08/2026','Rodada 20','','ALINE','','','','0',''],
  // Rodada 21
  ['08/2026','Rodada 21','','MURILO','','','','0',''],
  ['08/2026','Rodada 21','','THIAGO','','','','0',''],
  ['08/2026','Rodada 21','','MARCOS','','','','0',''],
  ['08/2026','Rodada 21','','STEFAN','','','','0',''],
  ['08/2026','Rodada 21','','BONA','','','','0',''],
  ['08/2026','Rodada 21','','CID','','','','0',''],
  ['08/2026','Rodada 21','','SAMUEL','','','','0',''],
  ['08/2026','Rodada 21','','EDSON','','','','0',''],
  ['08/2026','Rodada 21','','CARLOS','','','','0',''],
  ['08/2026','Rodada 21','','ALÊ','','','','0',''],
  ['08/2026','Rodada 21','','EVERTON','','','','0',''],
  ['08/2026','Rodada 21','','ALINE','','','','0',''],
  ['08/2026','Rodada 21','','GUSTAVO','','','','0',''],
  ['08/2026','Rodada 21','','JANICE','','','','0',''],
  ['08/2026','Rodada 21','','MATHEUS','','','','0',''],
  ['08/2026','Rodada 21','','JOAO GABRIEL','','','','0',''],
  ['08/2026','Rodada 21','','EZEQUIAS','','','','0',''],
  ['08/2026','Rodada 21','','ULYSSES','','','','0',''],
  ['08/2026','Rodada 21','','NICELIO','','','','0',''],
  ['08/2026','Rodada 21','','LUIZ','','','','0',''],
  ['08/2026','Rodada 21','','LUKINHA','','','','0',''],
  ['08/2026','Rodada 21','','CHINA','','','','0',''],
  ['08/2026','Rodada 21','','DU','','','','0',''],
  ['08/2026','Rodada 21','','CHRISTIAN','','','','0',''],
  // Rodada 22
  ['09/2026','Rodada 22','','MURILO','','','','0',''],
  ['09/2026','Rodada 22','','JANICE','','','','0',''],
  ['09/2026','Rodada 22','','GUSTAVO','','','','0',''],
  ['09/2026','Rodada 22','','JOAO GABRIEL','','','','0',''],
  ['09/2026','Rodada 22','','MATHEUS','','','','0',''],
  ['09/2026','Rodada 22','','ULYSSES','','','','0',''],
  ['09/2026','Rodada 22','','EZEQUIAS','','','','0',''],
  ['09/2026','Rodada 22','','LUIZ','','','','0',''],
  ['09/2026','Rodada 22','','NICELIO','','','','0',''],
  ['09/2026','Rodada 22','','CHINA','','','','0',''],
  ['09/2026','Rodada 22','','LUKINHA','','','','0',''],
  ['09/2026','Rodada 22','','CHRISTIAN','','','','0',''],
  ['09/2026','Rodada 22','','THIAGO','','','','0',''],
  ['09/2026','Rodada 22','','STEFAN','','','','0',''],
  ['09/2026','Rodada 22','','MARCOS','','','','0',''],
  ['09/2026','Rodada 22','','CID','','','','0',''],
  ['09/2026','Rodada 22','','BONA','','','','0',''],
  ['09/2026','Rodada 22','','EDSON','','','','0',''],
  ['09/2026','Rodada 22','','SAMUEL','','','','0',''],
  ['09/2026','Rodada 22','','ALÊ','','','','0',''],
  ['09/2026','Rodada 22','','CARLOS','','','','0',''],
  ['09/2026','Rodada 22','','ALINE','','','','0',''],
  ['09/2026','Rodada 22','','EVERTON','','','','0',''],
  ['09/2026','Rodada 22','','DU','','','','0',''],
  // Rodada 23
  ['09/2026','Rodada 23','','MURILO','','','','0',''],
  ['09/2026','Rodada 23','','STEFAN','','','','0',''],
  ['09/2026','Rodada 23','','THIAGO','','','','0',''],
  ['09/2026','Rodada 23','','CID','','','','0',''],
  ['09/2026','Rodada 23','','MARCOS','','','','0',''],
  ['09/2026','Rodada 23','','EDSON','','','','0',''],
  ['09/2026','Rodada 23','','BONA','','','','0',''],
  ['09/2026','Rodada 23','','ALÊ','','','','0',''],
  ['09/2026','Rodada 23','','SAMUEL','','','','0',''],
  ['09/2026','Rodada 23','','ALINE','','','','0',''],
  ['09/2026','Rodada 23','','CARLOS','','','','0',''],
  ['09/2026','Rodada 23','','DU','','','','0',''],
  ['09/2026','Rodada 23','','JANICE','','','','0',''],
  ['09/2026','Rodada 23','','JOAO GABRIEL','','','','0',''],
  ['09/2026','Rodada 23','','GUSTAVO','','','','0',''],
  ['09/2026','Rodada 23','','ULYSSES','','','','0',''],
  ['09/2026','Rodada 23','','MATHEUS','','','','0',''],
  ['09/2026','Rodada 23','','LUIZ','','','','0',''],
  ['09/2026','Rodada 23','','EZEQUIAS','','','','0',''],
  ['09/2026','Rodada 23','','CHINA','','','','0',''],
  ['09/2026','Rodada 23','','NICELIO','','','','0',''],
  ['09/2026','Rodada 23','','CHRISTIAN','','','','0',''],
  ['09/2026','Rodada 23','','LUKINHA','','','','0',''],
  ['09/2026','Rodada 23','','EVERTON','','','','0',''],
];

function parseDate(dateStr: string, monthCol: string): Date | null {
  if (!dateStr || dateStr === '') return null;

  const match = dateStr.match(/(\d{1,2})-(\w+\.?)/);
  if (match) {
    const day = parseInt(match[1]);
    const monthStr = match[2].replace('.', '');
    const monthNum = monthMap[monthStr];
    if (monthNum !== undefined) {
      const [colMonth, colYear] = monthCol.split('/');
      return new Date(parseInt(colYear), monthNum, day);
    }
  }
  return null;
}

function parseTime(timeStr: string): string | null {
  if (!timeStr || timeStr === '') return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return null;
}

function isAdiadoDate(dateStr: string): boolean {
  const d = dateStr.toLowerCase();
  return d === 'adiamento' || d.startsWith('adiamento') || d === 'chuva' || d.startsWith('jogar até') || d.startsWith('até');
}

async function main() {
  console.log('🎾 Importando dados atualizados do torneio Solaris...\n');

  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'Solaris', mode: 'insensitive' } },
  });
  if (!tournament) { console.error('❌ Torneio não encontrado!'); process.exit(1); }
  console.log(`✅ Torneio: ${tournament.name} (${tournament.id})`);

  const court = await prisma.court.findFirst({ where: { tournamentId: tournament.id } });
  if (!court) { console.error('❌ Quadra não encontrada!'); process.exit(1); }
  console.log(`✅ Quadra: ${court.name}`);

  // Delete all existing matches
  console.log('\n🗑️  Limpando jogos existentes...');
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
  console.log('  ✅ Todos os jogos antigos removidos');

  // Create users
  console.log('\n👤 Verificando participantes...');
  const passwordHash = await bcrypt.hash('123456', 12);
  const userMap: Record<string, string> = {};

  const existingUsers = await prisma.user.findMany();
  for (const u of existingUsers) {
    const entry = Object.entries(emailMap).find(([_, email]) => email === u.email);
    if (entry) userMap[entry[0]] = u.id;
  }

  for (const [name, email] of Object.entries(emailMap)) {
    if (userMap[name]) continue;
    const user = await prisma.user.create({
      data: { email, name: fullNameMap[name] || name, passwordHash },
    });
    userMap[name] = user.id;
    console.log(`  ✅ Criado: ${fullNameMap[name]} (${email})`);
  }

  // Add members
  console.log('\n👥 Verificando participantes do torneio...');
  for (const [name, userId] of Object.entries(userMap)) {
    const existing = await prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
    });
    if (!existing) {
      await prisma.tournamentMember.create({
        data: { tournamentId: tournament.id, userId, role: 'player', status: 'accepted', joinedAt: new Date() },
      });
      console.log(`  ✅ Adicionado: ${fullNameMap[name]}`);
    }
  }

  // Parse all matches first
  console.log('\n🎮 Preparando jogos...');
  type MatchData = {
    homeId: string; awayId: string; round: string; month: string;
    status: string; scheduledAt: Date | null; homeScore: number | null; awayScore: number | null;
    winnerId: string | null; endReason: string; isChallenge: boolean;
    woGivenById: string | null; woReceivedById: string | null; woReason: string | null;
    setsData: any[];
    player1: string; player2: string;
  };

  const matchList: MatchData[] = [];
  let skipped = 0;
  const parseSet = (v: string): number | string | null => {
    if (v === 'W.O.') return 'W.O.';
    if (v === '') return null;
    return parseInt(v);
  };

  for (let i = 0; i < DATA.length; i += 2) {
    const row1 = DATA[i];
    const row2 = DATA[i + 1];
    if (!row1 || !row2) break;

    const [month, round1, dateStr1, player1, s1a, s1b, s1c, tabela1, desafio1] = row1;
    const [, round2, dateStr2, player2, s2a, s2b, s2c, tabela2, desafio2] = row2;

    const homeId = userMap[player1];
    const awayId = userMap[player2];
    if (!homeId || !awayId) { skipped++; continue; }

    const isChallenge = desafio1 === '1' || desafio2 === '1' || round1 === 'DESAFIANTE' || round1 === 'DESAFIADO';
    const isWO = s1a === 'W.O.' || s2a === 'W.O.';
    const round = isChallenge ? 'Desafio' : round1;

    const sets1raw = [parseSet(s1a), parseSet(s1b), parseSet(s1c)].filter(v => v !== null) as (number | string)[];
    const sets2raw = [parseSet(s2a), parseSet(s2b), parseSet(s2c)].filter(v => v !== null) as (number | string)[];
    const hasAnyScore = (sets1raw.length > 0 || sets2raw.length > 0);

    // Parse date
    let scheduledAt: Date | null = null;
    const parsedDate = parseDate(dateStr1, month);
    const parsedDate2 = parseDate(dateStr2, month);
    const time2 = parseTime(dateStr2);

    if (parsedDate && time2) {
      const [h, min] = time2.split(':').map(Number);
      scheduledAt = new Date(parsedDate); scheduledAt.setHours(h, min, 0, 0);
    } else if (parsedDate) {
      scheduledAt = new Date(parsedDate); scheduledAt.setHours(12, 0, 0, 0);
    } else if (parsedDate2 && time2) {
      const [h, min] = time2.split(':').map(Number);
      scheduledAt = new Date(parsedDate2); scheduledAt.setHours(h, min, 0, 0);
    } else if (parsedDate2) {
      scheduledAt = new Date(parsedDate2); scheduledAt.setHours(12, 0, 0, 0);
    }

    // Status
    let status: string;
    if (isWO) {
      status = 'finished';
    } else if (hasAnyScore) {
      status = 'finished';
      if (!scheduledAt) {
        const [cm, cy] = month.split('/');
        scheduledAt = new Date(parseInt(cy), parseInt(cm) - 1, 1, 12, 0, 0);
      }
    } else {
      if (isAdiadoDate(dateStr1) || isAdiadoDate(dateStr2) || (dateStr1 === '' && dateStr2 === '')) {
        status = 'pending_scheduling'; scheduledAt = null;
      } else if (scheduledAt) {
        status = 'scheduled';
      } else {
        status = 'pending_scheduling';
      }
    }

    // Scores
    let homeScore = 0, awayScore = 0, winnerId: string | null = null;
    if (isWO) {
      homeScore = 2; awayScore = 0; winnerId = homeId;
    } else if (hasAnyScore && !isWO) {
      const s1 = sets1raw.filter(s => typeof s === 'number') as number[];
      const s2 = sets2raw.filter(s => typeof s === 'number') as number[];
      if (s1.length >= 2 && s2.length >= 2) {
        let h = 0, a = 0;
        for (let j = 0; j < Math.min(s1.length, s2.length); j++) {
          if (s1[j] > s2[j]) h++; else if (s2[j] > s1[j]) a++;
        }
        homeScore = h; awayScore = a;
        winnerId = h > a ? homeId : a > h ? awayId : null;
      }
    }

    // Sets
    const setsData: any[] = [];
    if (!isWO && hasAnyScore) {
      const s1 = sets1raw.filter(s => typeof s === 'number') as number[];
      const s2 = sets2raw.filter(s => typeof s === 'number') as number[];
      for (let j = 0; j < Math.max(s1.length, s2.length); j++) {
        const hg = s1[j] || 0, ag = s2[j] || 0;
        setsData.push({ setNumber: j + 1, homeGames: hg, awayGames: ag, isTiebreak: hg === 6 && ag === 6, isSuperTiebreak: false });
      }
    }

    matchList.push({
      homeId, awayId, round, month, status, scheduledAt,
      homeScore: (hasAnyScore || isWO) ? homeScore : null,
      awayScore: (hasAnyScore || isWO) ? awayScore : null,
      winnerId, endReason: isWO ? 'wo' : 'normal', isChallenge,
      woGivenById: isWO ? awayId : null, woReceivedById: isWO ? homeId : null,
      woReason: isWO ? 'Walkover' : null, setsData, player1, player2,
    });
  }

  // Insert in batches using transactions
  console.log(`  📋 ${matchList.length} jogos preparados, inserindo...`);
  let created = 0;
  // Insert individually (each is independent)
  for (const m of matchList) {
    try {
      await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homePlayerId: m.homeId,
          awayPlayerId: m.awayId,
          courtId: court.id,
          scheduledAt: m.scheduledAt,
          duration: 120,
          status: m.status,
          phase: 'ranking',
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          winnerId: m.winnerId,
          endReason: m.endReason,
          startedAt: m.status === 'finished' ? m.scheduledAt : null,
          finishedAt: m.status === 'finished' ? m.scheduledAt : null,
          round: m.round,
          month: m.month,
          isChallenge: m.isChallenge,
          woGivenById: m.woGivenById,
          woReceivedById: m.woReceivedById,
          woReason: m.woReason,
          sets: { create: m.setsData },
        },
      });
      created++;
      process.stdout.write(`\r  ⏳ ${created}/${matchList.length} jogos criados...`);
    } catch (e: any) {
      if (e.code === 'P2002') { skipped++; }
      else { console.log(`\n  ❌ ${m.player1} vs ${m.player2}: ${e.message}`); skipped++; }
    }
  }
  console.log(`\n  ✅ ${created} jogos criados com sucesso`);

  console.log(`\n📊 Resumo:`);
  console.log(`   Jogos criados: ${created}`);
  console.log(`   Jogos pulados: ${skipped}`);
  console.log(`   Total: ${created + skipped}`);
  console.log(`\n✨ Importação concluída!`);
}

main()
  .catch((e) => { console.error('❌ Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
