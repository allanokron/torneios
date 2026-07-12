import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Full CSV data from spreadsheet
const CSV_RAW = `MÊS,Rodada,DATA/HORA,TENISTA,1o SET ,2o SET ,3o SET ,Tabela,Desafio,Vitoria,Pontos,Set Ganho,Set Perd,Saldo Set,Game Ganho,Game Perd,Saldo Game,WO Venc,WO Perd,Adiamento
02/2026,Rodada 01,6-fev.,MURILO,6,6,,1,,1,200,2,0,2,12,0,12,,,
02/2026,Rodada 01,17:30,JOAO GABRIEL,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
02/2026,Rodada 01,10-fev.,JANICE,3,6,6,1,,1,170,2,1,1,15,13,2,,,
02/2026,Rodada 01,8:30,ULYSSES,6,4,3,1,,0,100,1,2,-1,13,15,-2,,,
02/2026,Rodada 01,2-fev.,GUSTAVO,6,7,,1,,1,200,2,0,2,13,8,5,,,
02/2026,Rodada 01,18:00,LUIZ,3,5,,1,,0,30,0,2,-2,8,13,-5,,,
02/2026,Rodada 01,6-mar.,GIULIA,7,3,2,1,,0,100,1,2,-1,12,17,-5,,,
02/2026,Rodada 01,20:00,CHINA,5,6,6,1,,1,170,2,1,1,17,12,5,,,
02/2026,Rodada 01,11-fev.,EZEQUIAS,2,3,,1,,0,30,0,2,-2,5,12,-7,,,
02/2026,Rodada 01,18:00,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,5,7,,,
02/2026,Rodada 01,14-fev.,NICELIO,0,2,,1,,0,30,0,2,-2,2,12,-10,,,
02/2026,Rodada 01,8:30,EVERTON,6,6,,1,,1,200,2,0,2,12,2,10,,,
02/2026,Rodada 01,4-fev.,STEFAN,3,1,,1,,0,30,0,2,-2,4,12,-8,,,
02/2026,Rodada 01,20:00,CID,6,6,,1,,1,200,2,0,2,12,4,8,,,
02/2026,Rodada 01,28-fev.,THIAGO,2,6,6,1,,1,170,2,1,1,14,7,7,,,
02/2026,Rodada 01,16:00,EDSON,6,0,1,1,,0,100,1,2,-1,7,14,-7,,,
02/2026,Rodada 01,6-fev.,GUILHERME,0,1,,1,,0,30,0,2,-2,1,12,-11,,,
02/2026,Rodada 01,16:00,ALÊ,6,6,,1,,1,200,2,0,2,12,1,11,,,
02/2026,Rodada 01,6-fev.,BONA,5,3,,1,,0,30,0,2,-2,8,13,-5,,,
02/2026,Rodada 01,18:30,ALINE,7,6,,1,,1,200,2,0,2,13,8,5,,,
02/2026,Rodada 01,17-fev.,SAMUEL,2,6,2,1,,0,100,1,2,-1,10,15,-5,,,
02/2026,Rodada 01,17:00,DU,6,3,6,1,,1,170,2,1,1,15,10,5,,,
02/2026,Rodada 01,8-fev.,CARLOS,7,6,,1,,1,200,2,0,2,13,7,6,,,
02/2026,Rodada 01,16:30,LUKINHA,6,1,,1,,0,30,0,2,-2,7,13,-6,,,
02/2026,Rodada 02,24-mar.,MURILO,7,6,,1,,1,200,2,0,2,13,7,6,,,
02/2026,Rodada 02,18:30,CID,5,2,,1,,0,30,0,2,-2,7,13,-6,,,1
02/2026,Rodada 02,7-fev.,STEFAN,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
02/2026,Rodada 02,8:00,EDSON,6,6,,1,,1,200,2,0,2,12,6,6,,,
02/2026,Rodada 02,16-fev.,THIAGO,6,6,,1,,1,200,2,0,2,12,4,8,,,
02/2026,Rodada 02,18:00,ALÊ,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
02/2026,Rodada 02,20-fev.,GUILHERME,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
02/2026,Rodada 02,18:30,ALINE,6,6,,1,,1,200,2,0,2,12,1,11,,,
02/2026,Rodada 02,ADIAMENTO,BONA,4,2,,1,,0,30,0,2,-2,6,12,-6,,,1
02/2026,Rodada 02,Jogar até 31/03,DU,6,6,,1,,1,200,2,0,2,12,6,6,,,
02/2026,Rodada 02,5-fev.,SAMUEL,6,6,,1,,1,200,2,0,2,12,2,10,,,
02/2026,Rodada 02,18:30,LUKINHA,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
02/2026,Rodada 02,5-fev.,JOAO GABRIEL,0,2,,1,,0,30,0,2,-2,2,12,-10,,,
02/2026,Rodada 02,8:30,ULYSSES,6,6,,1,,1,200,2,0,2,12,2,10,,,
02/2026,Rodada 02,13-fev.,JANICE,6,6,,1,,1,200,2,0,2,12,1,11,,,
02/2026,Rodada 02,9:00,LUIZ,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
02/2026,Rodada 02,20-mar.,GUSTAVO,7,6,,1,,1,200,2,0,2,13,8,5,,,
02/2026,Rodada 02,19:00,CHINA,5,3,,1,,0,30,0,2,-2,8,13,-5,,,1
02/2026,Rodada 02,28-fev.,GIULIA,0,2,,1,,0,30,0,2,-2,2,12,-10,,,
02/2026,Rodada 02,7:00,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,2,10,,,
02/2026,Rodada 02,21-fev.,EZEQUIAS,3,4,,1,,0,30,0,2,-2,7,12,-5,,,
02/2026,Rodada 02,7:30,EVERTON,6,6,,1,,1,200,2,0,2,12,7,5,,,
02/2026,Rodada 02,15-fev.,NICELIO,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
02/2026,Rodada 02,15:30,CARLOS,6,6,,1,,1,200,2,0,2,12,0,12,,,
02/2026,Rodada 03,21-fev.,MURILO,6,6,,1,,1,200,2,0,2,12,4,8,,,
02/2026,Rodada 03,7:30,ULYSSES,3,1,,1,,0,30,0,2,-2,4,12,-8,,,
02/2026,Rodada 03,,JOAO GABRIEL,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
02/2026,Rodada 03,,LUIZ,6,6,,1,,1,200,2,0,2,12,2,10,,,
02/2026,Rodada 03,31-mar.,JANICE,6,7,,1,,1,200,2,0,2,13,6,7,,,
02/2026,Rodada 03,19:30,CHINA,1,5,,1,,0,30,0,2,-2,6,13,-7,,,1
02/2026,Rodada 03,18-fev.,GUSTAVO,2,0,,1,,0,30,0,2,-2,2,12,-10,,,
02/2026,Rodada 03,18:30,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,2,10,,,
02/2026,Rodada 03,28-fev.,GIULIA,5,4,,1,,0,30,0,2,-2,9,13,-4,,,
02/2026,Rodada 03,16:00,EVERTON,7,6,,1,,1,200,2,0,2,13,9,4,,,
02/2026,Rodada 03,13-fev.,EZEQUIAS,3,3,,1,,0,30,0,2,-2,6,12,-6,,,
02/2026,Rodada 03,7:00,CARLOS,6,6,,1,,1,200,2,0,2,12,6,6,,,
02/2026,Rodada 03,,CID,3,5,,1,,0,30,0,2,-2,8,13,-5,,,
02/2026,Rodada 03,,EDSON,6,7,,1,,1,200,2,0,2,13,8,5,,,
02/2026,Rodada 03,21-fev.,STEFAN,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
02/2026,Rodada 03,7:00,ALÊ,6,6,,1,,1,200,2,0,2,12,4,8,,,
02/2026,Rodada 03,CHUVA,THIAGO,6,6,6,1,,1,170,2,1,1,18,10,8,,,
02/2026,Rodada 03,Jogar até 24/03,ALINE,7,0,3,1,,0,100,1,2,-1,10,18,-8,,,
02/2026,Rodada 03,13-fev.,GUILHERME,4,2,,1,,0,30,0,2,-2,6,12,-6,,,
02/2026,Rodada 03,18:30,DU,6,6,,1,,1,200,2,0,2,12,6,6,,,
02/2026,Rodada 03,26-fev.,BONA,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
02/2026,Rodada 03,19:00,LUKINHA,6,6,,1,,1,200,2,0,2,12,0,12,,,
02/2026,Rodada 03,7-fev.,SAMUEL,6,6,,1,,1,200,2,0,2,12,1,11,,,
02/2026,Rodada 03,16:30,NICELIO,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
03/2026,Rodada 04,,MURILO,6,2,,1,,0,30,0,2,-2,8,13,-5,,,
03/2026,Rodada 04,,EDSON,7,6,,1,,1,200,2,0,2,13,8,5,,,
03/2026,Rodada 04,,CID,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
03/2026,Rodada 04,,ALÊ,6,6,,1,,1,200,2,0,2,12,6,6,,,
03/2026,Rodada 04,,STEFAN,7,6,,1,,1,200,2,0,2,13,10,3,,,
03/2026,Rodada 04,,ALINE,6,4,,1,,0,30,0,2,-2,10,13,-3,,,
03/2026,Rodada 04,,THIAGO,6,6,,1,,1,200,2,0,2,12,8,4,,,
03/2026,Rodada 04,,DU,4,4,,1,,0,30,0,2,-2,8,12,-4,,,
03/2026,Rodada 04,,GUILHERME,4,2,,1,,0,30,0,2,-2,6,12,-6,,,
03/2026,Rodada 04,,LUKINHA,6,6,,1,,1,200,2,0,2,12,6,6,,,
03/2026,Rodada 04,22-mar.,BONA,6,6,,1,,1,200,2,0,2,12,3,9,,,
03/2026,Rodada 04,10:00,NICELIO,3,0,,1,,0,30,0,2,-2,3,12,-9,,,
03/2026,Rodada 04,,ULYSSES,6,6,,1,,1,200,2,0,2,12,4,8,,,
03/2026,Rodada 04,,LUIZ,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
03/2026,Rodada 04,,JOAO GABRIEL,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
03/2026,Rodada 04,,CHINA,6,6,,1,,1,200,2,0,2,12,1,11,,,
03/2026,Rodada 04,18-mar.,JANICE,5,6,,1,,0,30,0,2,-2,11,14,-3,,,
03/2026,Rodada 04,18:00,CHRISTIAN,7,7,,1,,1,200,2,0,2,14,11,3,,,
03/2026,Rodada 04,,GUSTAVO,6,6,,1,,1,200,2,0,2,12,8,4,,,
03/2026,Rodada 04,,EVERTON,4,4,,1,,0,30,0,2,-2,8,12,-4,,,
03/2026,Rodada 04,27-mar.,GIULIA,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
03/2026,Rodada 04,6:30,CARLOS,6,6,,1,,1,200,2,0,2,12,0,12,,,
03/2026,Rodada 04,,EZEQUIAS,2,7,2,1,,0,100,1,2,-1,11,18,-7,,,
03/2026,Rodada 04,,SAMUEL,6,6,6,1,,1,170,2,1,1,18,11,7,,,
03/2026,Rodada 05,,MURILO,6,6,,1,,1,200,2,0,2,12,0,12,,,
03/2026,Rodada 05,,LUIZ,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
03/2026,Rodada 05,26-abr.,ULYSSES,4,6,,1,,0,30,0,2,-2,10,13,-3,,,
03/2026,Rodada 05,7:00,CHINA,6,7,,1,,1,200,2,0,2,13,10,3,,,
03/2026,Rodada 05,25-mar.,JOAO GABRIEL,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
03/2026,Rodada 05,20:00,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,0,12,,,
03/2026,Rodada 05,,JANICE,6,6,,1,,1,200,2,0,2,12,3,9,,,
03/2026,Rodada 05,,EVERTON,2,1,,1,,0,30,0,2,-2,3,12,-9,,,
03/2026,Rodada 05,,GUSTAVO,6,4,6,1,,0,100,1,2,-1,16,17,-1,,,
03/2026,Rodada 05,,CARLOS,4,6,7,1,,1,170,2,1,1,17,16,1,,,
03/2026,Rodada 05,25-mar.,GIULIA,1,4,,1,,0,30,0,2,-2,5,12,-7,,,
03/2026,Rodada 05,18:30,SAMUEL,6,6,,1,,1,200,2,0,2,12,5,7,,,
03/2026,Rodada 05,4-abr.,EDSON,6,7,,1,,1,200,2,0,2,13,8,5,,,1
03/2026,Rodada 05,7:30,ALÊ,2,6,,1,,0,30,0,2,-2,8,13,-5,,,
03/2026,Rodada 05,30-mar.,CID,3,1,,1,,0,30,0,2,-2,4,12,-8,,,
03/2026,Rodada 05,18:30,ALINE,6,6,,1,,1,200,2,0,2,12,4,8,,,
03/2026,Rodada 05,W.O.,STEFAN,W.O.,,,1,,1,170,2,1,1,12,6,6,1,,
03/2026,Rodada 05,W.O.,DU,W.O.,,,1,,0,-50,0,2,-2,30-dec.,12,18-dec.,,1,
03/2026,Rodada 05,Chuva,THIAGO,6,6,,1,,1,200,2,0,2,12,4,8,,,
03/2026,Rodada 05,Jogar até 15/04,LUKINHA,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
03/2026,Rodada 05,ADIAMENTO,GUILHERME,6,4,3,1,,0,100,1,2,-1,13,14,-1,,,1
03/2026,Rodada 05,Jogar até 30/04,NICELIO,2,6,6,1,,1,170,2,1,1,14,13,1,,,
03/2026,Rodada 05,17-mar.,BONA,3,4,,1,,0,30,0,2,-2,7,12,-5,,,
03/2026,Rodada 05,18:30,EZEQUIAS,6,6,,1,,1,200,2,0,2,12,7,5,,,
03/2026,Rodada 06,,MURILO,6,6,6,1,,1,170,2,1,1,18,11,7,,,
03/2026,Rodada 06,,ALÊ,3,7,1,1,,0,100,1,2,-1,11,18,-7,,,
03/2026,Rodada 06,,EDSON,7,6,6,1,,1,170,2,1,1,19,14,5,,,
03/2026,Rodada 06,,ALINE,5,7,2,1,,0,100,1,2,-1,14,19,-5,,,
03/2026,Rodada 06,29-mai.,CID,2,2,,1,,0,30,0,2,-2,4,12,-8,,,1
03/2026,Rodada 06,19:00,DU,6,6,,1,,1,200,2,0,2,12,4,8,,,1
03/2026,Rodada 06,15-mar.,STEFAN,3,6,6,1,,1,170,2,1,1,15,11,4,,,
03/2026,Rodada 06,19:00,LUKINHA,6,4,1,1,,0,100,1,2,-1,11,15,-4,,,
03/2026,Rodada 06,,THIAGO,6,6,,1,,1,200,2,0,2,12,3,9,,,
03/2026,Rodada 06,,NICELIO,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
03/2026,Rodada 06,,GUILHERME,3,3,,1,,0,30,0,2,-2,6,12,-6,,,
03/2026,Rodada 06,,EZEQUIAS,6,6,,1,,1,200,2,0,2,12,6,6,,,
03/2026,Rodada 06,,LUIZ,2,0,,1,,0,30,0,2,-2,2,12,-10,,,
03/2026,Rodada 06,,CHINA,6,6,,1,,1,200,2,0,2,12,2,10,,,
03/2026,Rodada 06,,ULYSSES,6,1,2,1,,0,100,1,2,-1,9,16,-7,,,
03/2026,Rodada 06,,CHRISTIAN,4,6,6,1,,1,170,2,1,1,16,9,7,,,
03/2026,Rodada 06,22-mar.,JOAO GABRIEL,3,2,,1,,0,30,0,2,-2,5,12,-7,,,
03/2026,Rodada 06,16:30,EVERTON,6,6,,1,,1,200,2,0,2,12,5,7,,,
03/2026,Rodada 06,,JANICE,6,6,,1,,1,200,2,0,2,12,0,12,,,
03/2026,Rodada 06,,CARLOS,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
03/2026,Rodada 06,16-mar.,GUSTAVO,6,6,2,1,,0,100,1,2,-1,14,17,-3,,,
03/2026,Rodada 06,19:00,SAMUEL,7,4,6,1,,1,170,2,1,1,17,14,3,,,
03/2026,Rodada 06,20-mar.,GIULIA,6,6,,1,,1,200,2,0,2,12,7,5,,,
03/2026,Rodada 06,17:00,BONA,4,3,,1,,0,30,0,2,-2,7,12,-5,,,
04/2026,Rodada 07,23-abr.,MURILO,6,7,,1,,1,200,2,0,2,13,7,6,,,
04/2026,Rodada 07,19:30,CHINA,2,5,,1,,0,30,0,2,-2,7,13,-6,,,
04/2026,Rodada 07,,LUIZ,0,2,,1,,0,30,0,2,-2,2,12,-10,,,
04/2026,Rodada 07,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,2,10,,,
04/2026,Rodada 07,,ULYSSES,4,4,,1,,0,30,0,2,-2,8,12,-4,,,
04/2026,Rodada 07,,EVERTON,6,6,,1,,1,200,2,0,2,12,8,4,,,
04/2026,Rodada 07,21-abr.,JOAO GABRIEL,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
04/2026,Rodada 07,6:30,CARLOS,6,6,,1,,1,200,2,0,2,12,0,12,,,
04/2026,Rodada 07,,JANICE,6,6,,1,,1,200,2,0,2,12,6,6,,,
04/2026,Rodada 07,,SAMUEL,3,3,,1,,0,30,0,2,-2,6,12,-6,,,
04/2026,Rodada 07,,GUSTAVO,6,6,,1,,1,200,2,0,2,12,2,10,,,
04/2026,Rodada 07,,BONA,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
04/2026,Rodada 07,,ALÊ,6,6,,1,,1,200,2,0,2,12,8,4,,,
04/2026,Rodada 07,,ALINE,4,4,,1,,0,30,0,2,-2,8,12,-4,,,
04/2026,Rodada 07,,EDSON,6,6,,1,,1,200,2,0,2,12,6,6,,,
04/2026,Rodada 07,,DU,4,2,,1,,0,30,0,2,-2,6,12,-6,,,
04/2026,Rodada 07,21-abr.,CID,6,4,5,1,,0,100,1,2,-1,15,17,-2,,,
04/2026,Rodada 07,16:30,LUKINHA,4,6,7,1,,1,170,2,1,1,17,15,2,,,
04/2026,Rodada 07,,STEFAN,6,6,,1,,1,200,2,0,2,12,4,8,,,
04/2026,Rodada 07,,NICELIO,1,3,,1,,0,30,0,2,-2,4,12,-8,,,
04/2026,Rodada 07,,THIAGO,6,6,,1,,1,200,2,0,2,12,8,4,,,
04/2026,Rodada 07,,EZEQUIAS,4,4,,1,,0,30,0,2,-2,8,12,-4,,,
04/2026,DESAFIANTE,,DU,7,6,6,,1,,250,,,,,,,,,
04/2026,DESAFIADO,,CHINA,6,1,4,,1,,0,,,,,,,,,
04/2026,Rodada 07,20-abr.,GUILHERME,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
04/2026,Rodada 07,17:00,GIULIA,6,6,,1,,1,200,2,0,2,12,6,6,,,
04/2026,Rodada 08,30-abr.,MURILO,7,6,,1,,1,200,2,0,2,13,7,6,,,
04/2026,Rodada 08,17:00,ALINE,5,2,,1,,0,30,0,2,-2,7,13,-6,,,
04/2026,Rodada 08,,ALÊ,1,4,,1,,0,30,0,2,-2,5,10,-5,,,
04/2026,Rodada 08,,DU,4,6,,1,,1,200,2,0,2,10,5,5,,,
04/2026,Rodada 08,,EDSON,7,6,,1,,1,200,2,0,2,13,8,5,,,
04/2026,Rodada 08,,LUKINHA,6,2,,1,,0,30,0,2,-2,8,13,-5,,,
04/2026,Rodada 08,31-mai.,CID,6,6,,1,,1,200,2,0,2,12,3,9,,,
04/2026,Rodada 08,7:00,NICELIO,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
04/2026,Rodada 08,,STEFAN,6,1,6,1,,1,170,2,1,1,13,11,2,,,
04/2026,Rodada 08,,EZEQUIAS,2,6,3,1,,0,100,1,2,-1,11,13,-2,,,
04/2026,Rodada 08,24-abr.,THIAGO,6,6,,1,,1,200,2,0,2,12,4,8,,,
04/2026,Rodada 08,18:30,GIULIA,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
04/2026,Rodada 08,,CHINA,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
04/2026,Rodada 08,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,3,9,,,
04/2026,Rodada 08,,LUIZ,3,5,,1,,0,30,0,2,-2,8,13,-5,,,
04/2026,Rodada 08,,EVERTON,6,7,,1,,1,200,2,0,2,13,8,5,,,
04/2026,Rodada 08,,ULYSSES,2,6,7,1,,1,170,2,1,1,15,14,1,,,
04/2026,Rodada 08,,CARLOS,6,3,5,1,,0,100,1,2,-1,14,15,-1,,,
04/2026,Rodada 08,,JOAO GABRIEL,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
04/2026,Rodada 08,,SAMUEL,6,6,,1,,1,200,2,0,2,12,1,11,,,
04/2026,Rodada 08,24-abr.,JANICE,6,6,,1,,1,200,2,0,2,12,0,12,,,
04/2026,Rodada 08,17:00,BONA,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
04/2026,Rodada 08,30-abr.,GUSTAVO,6,6,,1,,1,200,2,0,2,12,0,12,,,
04/2026,Rodada 08,21:00,GUILHERME,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
04/2026,Rodada 09,,MURILO,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
04/2026,Rodada 09,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,3,9,,,
04/2026,Rodada 09,,CHINA,5,3,,1,,0,30,0,2,-2,8,13,-5,,,
04/2026,Rodada 09,,EVERTON,7,6,,1,,1,200,2,0,2,13,8,5,,,
04/2026,Rodada 09,,LUIZ,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
04/2026,Rodada 09,,CARLOS,6,6,,1,,1,200,2,0,2,12,0,12,,,
04/2026,Rodada 09,,ULYSSES,5,6,7,1,,1,170,2,1,1,18,16,2,,,
04/2026,Rodada 09,,SAMUEL,7,3,6,1,,0,100,1,2,-1,16,18,-2,,,
04/2026,Rodada 09,28-abr.,JOAO GABRIEL,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
04/2026,Rodada 09,16:00,BONA,6,6,,1,,1,200,2,0,2,12,1,11,,,
04/2026,Rodada 09,,JANICE,6,6,,1,,1,200,2,0,2,12,0,12,,,
04/2026,Rodada 09,,GUILHERME,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
04/2026,Rodada 09,29-abr.,ALINE,5,1,,1,,0,30,0,2,-2,6,13,-7,,,
04/2026,Rodada 09,19:00,DU,7,6,,1,,1,200,2,0,2,13,6,7,,,
04/2026,Rodada 09,25-abr.,ALÊ,6,6,6,1,,1,170,2,1,1,18,13,5,,,
04/2026,Rodada 09,16:00,LUKINHA,3,7,3,1,,0,100,1,2,-1,13,18,-5,,,
04/2026,Rodada 09,,EDSON,6,6,,1,,1,200,2,0,2,12,0,12,,,
04/2026,Rodada 09,,NICELIO,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
04/2026,Rodada 09,,CID,5,3,,1,,0,30,0,2,-2,8,13,-5,,,
04/2026,Rodada 09,,EZEQUIAS,7,6,,1,,1,200,2,0,2,13,8,5,,,
04/2026,Rodada 09,22-abr.,STEFAN,6,6,,1,,1,200,2,0,2,12,2,10,,,
04/2026,Rodada 09,19:00,GIULIA,0,2,,1,,0,30,0,2,-2,2,12,-10,,,
04/2026,Rodada 09,27-abr.,THIAGO,6,6,,1,,1,200,2,0,2,12,6,6,,,
04/2026,Rodada 09,19:30,GUSTAVO,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
05/2026,Rodada 10,28-mai.,MURILO,3,6,2,1,,0,100,1,2,-1,11,13,-2,,,
05/2026,Rodada 10,19:00,DU,6,1,6,1,,1,170,2,1,1,13,11,2,,,
05/2026,Rodada 10,,ALINE,6,6,6,1,,1,170,2,1,1,18,12,6,,,
05/2026,Rodada 10,,LUKINHA,4,7,1,1,,0,100,1,2,-1,12,18,-6,,,
05/2026,Rodada 10,,ALÊ,6,6,,1,,1,200,2,0,2,12,2,10,,,
05/2026,Rodada 10,,NICELIO,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
05/2026,Rodada 10,,EDSON,6,6,,1,,1,200,2,0,2,12,4,8,,,
05/2026,Rodada 10,,EZEQUIAS,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
05/2026,Rodada 10,Adiamento,CID,6,6,,1,,1,200,2,0,2,12,3,9,,,
05/2026,Rodada 10,Até 30/06,GIULIA,1,2,,1,,0,30,0,2,-2,3,12,-9,,,1
05/2026,Rodada 10,,STEFAN,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
05/2026,Rodada 10,,GUSTAVO,6,6,,1,,1,200,2,0,2,12,4,8,,,
05/2026,Rodada 10,22-mai.,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,2,10,,,
05/2026,Rodada 10,20:00,EVERTON,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
05/2026,Rodada 10,,CHINA,5,7,7,1,,1,170,2,1,1,19,18,1,,,
05/2026,Rodada 10,,CARLOS,7,6,5,1,,0,100,1,2,-1,18,19,-1,,,
05/2026,Rodada 10,,LUIZ,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
05/2026,Rodada 10,,SAMUEL,6,6,,1,,1,200,2,0,2,12,3,9,,,
05/2026,Rodada 10,,ULYSSES,6,6,,1,,1,200,2,0,2,12,6,6,,,
05/2026,Rodada 10,,BONA,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
05/2026,Rodada 10,,JOAO GABRIEL,6,6,,1,,1,200,2,0,2,12,6,6,,,
05/2026,Rodada 10,,GUILHERME,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
05/2026,Rodada 10,,JANICE,6,2,5,1,,0,100,1,2,-1,13,17,-4,,,
05/2026,Rodada 10,,THIAGO,4,6,7,1,,1,170,2,1,1,17,13,4,,,
05/2026,Rodada 11,Adiamento,MURILO,,,,0,,0,0,0,0,0,0,0,0,,,1
05/2026,Rodada 11,Até 31/07,EVERTON,,,,0,,0,0,0,0,0,0,0,0,,,1
05/2026,Rodada 11,27-mai.,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,3,9,,,
05/2026,Rodada 11,20:00,CARLOS,2,1,,1,,0,30,0,2,-2,3,12,-9,,,
05/2026,Rodada 11,,CHINA,6,2,3,1,,0,100,1,2,-1,11,16,-5,,,
05/2026,Rodada 11,,SAMUEL,4,6,6,1,,1,170,2,1,1,16,11,5,,,
05/2026,Rodada 11,21-mai.,LUIZ,6,3,6,1,,1,170,2,1,1,15,13,2,,,
05/2026,Rodada 11,17:00,BONA,3,6,4,1,,0,100,1,2,-1,13,15,-2,,,
05/2026,Rodada 11,22-mai.,ULYSSES,6,6,6,1,,1,170,2,1,1,18,13,5,,,
05/2026,Rodada 11,16:30,MARCOS,4,7,2,1,,0,100,1,2,-1,13,18,-5,,,
05/2026,Rodada 11,,JOAO GABRIEL,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
05/2026,Rodada 11,,THIAGO,6,6,,1,,1,200,2,0,2,12,3,9,,,
05/2026,Rodada 11,21-mai.,DU,6,6,,1,,1,200,2,0,2,12,4,8,,,
05/2026,Rodada 11,19:00,LUKINHA,1,3,,1,,0,30,0,2,-2,4,12,-8,,,
05/2026,Rodada 11,,ALINE,6,6,,1,,1,200,2,0,2,12,1,11,,,
05/2026,Rodada 11,,NICELIO,0,1,,1,,0,30,0,2,-2,1,12,-11,,,
05/2026,Rodada 11,,ALÊ,6,2,6,1,,1,170,2,1,1,14,10,4,,,
05/2026,Rodada 11,,EZEQUIAS,2,6,2,1,,0,100,1,2,-1,10,14,-4,,,
05/2026,Rodada 11,,EDSON,7,6,,1,,1,200,2,0,2,13,7,6,,,
05/2026,Rodada 11,,GIULIA,6,1,,1,,0,30,0,2,-2,7,13,-6,,,
05/2026,Rodada 11,,CID,3,4,,1,,0,30,0,2,-2,7,12,-5,,,
05/2026,Rodada 11,,GUSTAVO,6,6,,1,,1,200,2,0,2,12,7,5,,,
05/2026,Rodada 11,Adiamento,STEFAN,2,4,,1,,0,30,0,2,-2,6,12,-6,,,
05/2026,Rodada 11,Até 30/06,JANICE,6,6,,1,,1,200,2,0,2,12,6,6,,,1
05/2026,Rodada 12,,MURILO,3,6,6,1,,1,170,2,1,1,15,8,7,,,
05/2026,Rodada 12,,LUKINHA,6,0,2,1,,0,100,1,2,-1,8,15,-7,,,
05/2026,Rodada 12,Adiamento,DU,6,6,,1,,1,200,2,0,2,12,4,8,,,1
05/2026,Rodada 12,Até 30/06,NICELIO,4,0,,1,,0,30,0,2,-2,4,12,-8,,,
05/2026,Rodada 12,26-mai.,ALINE,6,6,6,1,,1,170,2,1,1,18,13,5,,,
05/2026,Rodada 12,19:30,EZEQUIAS,7,2,4,1,,0,100,1,2,-1,13,18,-5,,,
05/2026,Rodada 12,W.O.,ALÊ,W.O.,,,1,,1,170,2,1,1,12,6,6,1,,
05/2026,Rodada 12,W.O.,GIULIA,W.O.,,,,,,,,,,,,,,1,1
05/2026,Rodada 12,,EDSON,6,6,5,1,,0,100,1,2,-1,17,16,1,,,
05/2026,Rodada 12,,GUSTAVO,2,7,7,1,,1,170,2,1,1,16,17,-1,,,
05/2026,Rodada 12,31-mai.,CID,2,1,,1,,0,30,0,2,-2,3,12,-9,,,
05/2026,Rodada 12,17:00,JANICE,6,6,,1,,1,200,2,0,2,12,3,9,,,
05/2026,Rodada 12,,EVERTON,1,6,6,1,,1,170,2,1,1,13,13,0,,,
05/2026,Rodada 12,,CARLOS,6,3,4,1,,0,100,1,2,-1,13,13,0,,,
05/2026,Rodada 12,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,2,10,,,
05/2026,Rodada 12,,SAMUEL,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
05/2026,Rodada 12,24-mai.,CHINA,7,6,,1,,1,200,2,0,2,13,5,8,,,
05/2026,Rodada 12,17:30,BONA,5,0,,1,,0,30,0,2,-2,5,13,-8,,,
05/2026,Rodada 12,25-mai.,LUIZ,1,6,3,1,,0,100,1,2,-1,10,15,-5,,,
05/2026,Rodada 12,16:00,MARCOS,6,3,6,1,,1,170,2,1,1,15,10,5,,,
05/2026,Rodada 12,,ULYSSES,1,4,,1,,0,30,0,2,-2,5,12,-7,,,
05/2026,Rodada 12,,THIAGO,6,6,,1,,1,200,2,0,2,12,5,7,,,
05/2026,Rodada 12,27-mai.,JOAO GABRIEL,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
05/2026,Rodada 12,18:20,STEFAN,6,6,,1,,1,200,2,0,2,12,3,9,,,
06/2026,Rodada 13,Chuva,MURILO,6,6,,1,,1,200,2,0,2,12,8,4,,,
06/2026,Rodada 13,Jogar até 07/07,CARLOS,4,4,,1,,0,30,0,2,-2,8,12,-4,,,
06/2026,Rodada 13,24-jun.,EVERTON,0,6,6,1,,0,100,1,2,-1,12,16,-4,,,
06/2026,Rodada 13,8:00,SAMUEL,6,3,7,1,,1,170,2,1,1,16,12,4,,,
06/2026,Rodada 13,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,1,11,,,
06/2026,Rodada 13,,BONA,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
06/2026,Rodada 13,,CHINA,7,0,0,1,,0,100,1,2,-1,7,17,-10,,,
06/2026,Rodada 13,,MARCOS,5,6,6,1,,1,170,2,1,1,17,7,10,,,
06/2026,Rodada 13,,LUIZ,2,0,,1,,0,30,0,2,-2,2,12,-10,,,
06/2026,Rodada 13,,THIAGO,6,6,,1,,1,200,2,0,2,12,2,10,,,
06/2026,Rodada 13,,ULYSSES,6,6,,1,,1,200,2,0,2,12,7,5,,,
06/2026,Rodada 13,,STEFAN,3,4,,1,,0,30,0,2,-2,7,12,-5,,,
06/2026,Rodada 13,,LUKINHA,6,6,,1,,1,200,2,0,2,12,2,10,,,
06/2026,Rodada 13,,NICELIO,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
06/2026,Rodada 13,28-jun.,DU,6,6,4,1,,0,100,1,2,-1,16,17,-1,,,
06/2026,Rodada 13,16:00,EZEQUIAS,7,4,6,1,,1,170,2,1,1,17,16,1,,,
06/2026,Rodada 13,W.O.,ALINE,W.O.,,,1,,1,170,2,1,1,12,6,6,1,,
06/2026,Rodada 13,W.O.,GIULIA,W.O.,,,,,,,,,,,,,,1,1
06/2026,Rodada 13,,ALÊ,6,2,,1,,0,30,0,2,-2,8,13,-5,,,
06/2026,Rodada 13,,GUSTAVO,7,6,,1,,1,200,2,0,2,13,8,5,,,
06/2026,Rodada 13,Adiamento,EDSON,,,,0,,0,0,0,0,0,0,0,0,,,1
06/2026,Rodada 13,Até 31/07,JANICE,,,,0,,0,0,0,0,0,0,0,0,,,
06/2026,Rodada 13,30-jun.,CID,6,6,,1,,1,200,2,0,2,12,2,10,,,
06/2026,Rodada 13,20:00,JOAO GABRIEL,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
06/2026,Rodada 14,Adiamento,MURILO,,,,0,,0,0,0,0,0,0,0,0,,,
06/2026,Rodada 14,Até 31/07,NICELIO,,,,0,,0,0,0,0,0,0,0,0,,,
06/2026,Rodada 14,,LUKINHA,4,6,6,1,,1,170,2,1,1,16,7,9,,,
06/2026,Rodada 14,,EZEQUIAS,6,1,0,1,,0,100,1,2,-1,7,16,-9,,,
06/2026,Rodada 14,W.O.,DU,W.O.,,,1,,1,170,2,1,1,12,6,6,1,,
06/2026,Rodada 14,W.O.,GIULIA,W.O.,,,,,,,,,,,,,,1,
06/2026,Rodada 14,,ALINE,5,4,,1,,0,30,0,2,-2,9,13,-4,,,
06/2026,Rodada 14,,GUSTAVO,7,6,,1,,1,200,2,0,2,13,9,4,,,
06/2026,Rodada 14,,ALÊ,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
06/2026,Rodada 14,,JANICE,6,6,,1,,1,200,2,0,2,12,2,10,,,
06/2026,Rodada 14,Adiamento,EDSON,6,6,,1,,1,200,2,0,2,12,3,9,,,
06/2026,Rodada 14,Até 31/07,JOAO GABRIEL,3,0,,1,,0,30,0,2,-2,3,12,-9,,,1
06/2026,Rodada 14,29-jun.,CARLOS,6,3,0,1,,0,100,1,2,-1,9,15,-6,,,
06/2026,Rodada 14,20:00,SAMUEL,3,6,6,1,,1,170,2,1,1,15,9,6,,,
06/2026,Rodada 14,,EVERTON,6,6,,1,,1,200,2,0,2,12,2,10,,,
06/2026,Rodada 14,,BONA,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
06/2026,Rodada 14,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,1,11,,,
06/2026,Rodada 14,,MARCOS,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
06/2026,Rodada 14,,CHINA,1,2,,1,,0,30,0,2,-2,3,12,-9,,,
06/2026,Rodada 14,,THIAGO,6,6,,1,,1,200,2,0,2,12,3,9,,,
06/2026,Rodada 14,,LUIZ,3,6,,1,,0,30,0,2,-2,9,13,-4,,,
06/2026,Rodada 14,,STEFAN,6,7,,1,,1,200,2,0,2,13,9,4,,,
06/2026,Rodada 14,Adiamento,ULYSSES,,,,0,,0,0,0,0,0,0,0,0,,,
06/2026,Rodada 14,Até 31/07,CID,,,,0,,0,0,0,0,0,0,0,0,,,1
06/2026,Rodada 15,,MURILO,6,2,7,1,,1,170,2,1,1,15,15,0,,,
06/2026,Rodada 15,,SAMUEL,4,6,5,1,,0,100,1,2,-1,15,15,0,,,
06/2026,Rodada 15,26-jun.,CARLOS,6,6,,1,,1,200,2,0,2,12,1,11,,,
06/2026,Rodada 15,19:15,BONA,1,0,,1,,0,30,0,2,-2,1,12,-11,,,
06/2026,Rodada 15,Adiamento,EVERTON,,,,0,,0,0,0,0,0,0,0,0,,,1
06/2026,Rodada 15,Até 31/07,MARCOS,,,,0,,0,0,0,0,0,0,0,0,,,
06/2026,Rodada 15,1-jul.,CHRISTIAN,6,3,6,1,,1,170,2,1,1,15,14,1,,,
06/2026,Rodada 15,19:15,THIAGO,4,6,4,1,,0,100,1,2,-1,14,15,-1,,,1
06/2026,Rodada 15,27-jun.,CHINA,6,6,,1,,1,200,2,0,2,12,3,9,,,
06/2026,Rodada 15,16:00,STEFAN,0,3,,1,,0,30,0,2,-2,3,12,-9,,,
06/2026,Rodada 15,26-jun.,LUIZ,6,1,,1,,0,30,0,2,-2,7,13,-6,,,
06/2026,Rodada 15,16:15,CID,7,6,,1,,1,200,2,0,2,13,7,6,,,
06/2026,Rodada 15,,NICELIO,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
06/2026,Rodada 15,,EZEQUIAS,6,6,,1,,1,200,2,0,2,12,4,8,,,
06/2026,Rodada 15,W.O.,LUKINHA,W.O.,,,1,,1,170,2,1,1,12,6,6,1,,
06/2026,Rodada 15,W.O.,GIULIA,W.O.,,,,,,,,,,,,,,1,
06/2026,Rodada 15,,DU,6,2,7,1,,1,170,2,1,1,15,14,1,,,
06/2026,Rodada 15,,GUSTAVO,2,6,6,1,,0,100,1,2,-1,14,15,-1,,,
06/2026,Rodada 15,30-jun.,ALINE,0,0,,1,,0,30,0,2,-2,0,12,-12,,,
06/2026,Rodada 15,18:00,JANICE,6,6,,1,,1,200,2,0,2,12,0,12,,,
06/2026,Rodada 15,28-jun.,ALÊ,6,6,,1,,1,200,2,0,2,12,5,7,,,
06/2026,Rodada 15,7:30,JOAO GABRIEL,3,2,,1,,0,30,0,2,-2,5,12,-7,,,
06/2026,Rodada 15,,EDSON,6,6,,1,,1,200,2,0,2,12,6,6,,,
06/2026,Rodada 15,,ULYSSES,4,2,,1,,0,30,0,2,-2,6,12,-6,,,
07/2026,Rodada 16,,MURILO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,EZEQUIAS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,NICELIO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,MATHEUS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,LUKINHA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,GUSTAVO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,DU,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,JANICE,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,ALINE,6,6,,1,,1,200,2,0,2,12,2,10,,,
07/2026,Rodada 16,,JOAO GABRIEL,1,1,,1,,0,30,0,2,-2,2,12,-10,,,
07/2026,Rodada 16,,ALÊ,6,4,,1,,0,30,0,2,-2,10,13,-3,,,
07/2026,Rodada 16,,ULYSSES,7,6,,1,,1,200,2,0,2,13,10,3,,,
07/2026,Rodada 16,,SAMUEL,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,BONA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,CARLOS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,MARCOS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,EVERTON,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,THIAGO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,CHRISTIAN,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,STEFAN,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,CHINA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,CID,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,LUIZ,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 16,,EDSON,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,MURILO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,BONA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,SAMUEL,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,MARCOS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,CARLOS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,THIAGO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,EVERTON,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,STEFAN,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,CHRISTIAN,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,CID,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,CHINA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,EDSON,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,EZEQUIAS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,MATHEUS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,NICELIO,2,1,,1,,0,30,0,2,-2,3,12,-9,,,
07/2026,Rodada 17,,GUSTAVO,6,6,,1,,1,200,2,0,2,12,3,9,,,
07/2026,Rodada 17,,LUKINHA,1,3,,1,,0,30,0,2,-2,4,12,-8,,,
07/2026,Rodada 17,,JANICE,6,6,,1,,1,200,2,0,2,12,4,8,,,
07/2026,Rodada 17,,DU,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,JOAO GABRIEL,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,ALINE,6,7,,1,,1,200,2,0,2,13,8,5,,,
07/2026,Rodada 17,,ULYSSES,3,5,,1,,0,30,0,2,-2,8,13,-5,,,
07/2026,Rodada 17,,ALÊ,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 17,,LUIZ,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,MURILO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,MATHEUS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,EZEQUIAS,2,2,,1,,0,30,0,2,-2,4,12,-8,,,
07/2026,Rodada 18,,GUSTAVO,6,6,,1,,1,200,2,0,2,12,4,8,,,
07/2026,Rodada 18,,NICELIO,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,JANICE,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,LUKINHA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,JOAO GABRIEL,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,DU,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,ULYSSES,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,ALINE,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,LUIZ,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,BONA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,MARCOS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,SAMUEL,2,3,,1,,0,30,0,2,-2,5,12,-7,,,
07/2026,Rodada 18,,THIAGO,6,6,,1,,1,200,2,0,2,12,5,7,,,
07/2026,Rodada 18,,CARLOS,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,STEFAN,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,EVERTON,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,CID,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,CHRISTIAN,6,6,,1,,1,200,2,0,2,12,3,9,,,
07/2026,Rodada 18,,EDSON,3,0,,1,,0,30,0,2,-2,3,12,-9,,,
07/2026,Rodada 18,,CHINA,,,,0,,0,0,0,0,0,0,0,0,,,
07/2026,Rodada 18,,ALÊ,,,,0,,0,0,0,0,0,0,0,0,,,`

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  for (const char of line) {
    if (char === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string, monthStr: string): Date | null {
  if (!dateStr || dateStr === 'ADIAMENTO' || dateStr === 'CHUVA' || 
      dateStr.startsWith('Jogar até') || dateStr.startsWith('Até') ||
      dateStr === 'W.O.' || dateStr === 'Adiamento') return null
  
  const monthMap: Record<string, number> = {
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  }
  
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/)
  let hour = 0, minute = 0
  if (timeMatch) {
    hour = parseInt(timeMatch[1])
    minute = parseInt(timeMatch[2])
  }
  
  const dayMatch = dateStr.match(/(\d{1,2})[-\s](\w+)/)
  if (dayMatch) {
    const day = parseInt(dayMatch[1])
    const mon = monthMap[dayMatch[2].toLowerCase()]
    if (mon !== undefined && monthStr) {
      const yearMonth = monthStr.split('/')
      const year = parseInt(yearMonth[1]) || 2026
      return new Date(year, mon, day, hour, minute, 0, 0)
    }
  }
  
  if (timeMatch && monthStr) {
    const yearMonth = monthStr.split('/')
    const year = parseInt(yearMonth[1]) || 2026
    const mon = parseInt(yearMonth[0]) - 1
    return new Date(year, mon, 1, hour, minute, 0, 0)
  }
  
  return null
}

async function main() {
  console.log('=== Starting spreadsheet import ===')
  
  const lines = CSV_RAW.split('\n').filter(l => l.trim())
  const dataLines = lines.slice(1) // skip header
  
  const rows = dataLines.map(line => {
    const f = parseCSVLine(line)
    return {
      month: f[0] || '',
      round: f[1] || '',
      dateTime: f[2] || '',
      player: f[3] || '',
      set1: f[4] || '',
      set2: f[5] || '',
      set3: f[6] || '',
      tabela: f[7] || '',
      desafio: f[8] || '',
      vitoria: f[9] || '',
      pontos: f[10] || '',
      woVenc: f[17] || '',
      woPerd: f[18] || '',
      adiamento: f[19] || '',
    }
  })
  
  console.log(`Parsed ${rows.length} rows`)
  
  // Filter only Tabela rows (exclude DESAFIANTE/DESAFIADO)
  const tabelaRows = rows.filter(r => r.tabela === '1' && r.round !== 'DESAFIANTE' && r.round !== 'DESAFIADO')
  console.log(`Tabela rows: ${tabelaRows.length}`)
  
  // Get tournament
  const tournament = await prisma.tournament.findFirst()
  if (!tournament) { console.error('No tournament!'); return }
  console.log(`Tournament: ${tournament.name}`)
  
  // Get all users with normalized names
  const users = await prisma.user.findMany()
  const userByNorm: Record<string, typeof users[0]> = {}
  for (const u of users) {
    userByNorm[normalize(u.name)] = u
  }
  console.log(`Users: ${users.length}`)
  console.log('User keys:', Object.keys(userByNorm).join(', '))
  
  // Match pairs: consecutive rows in same round+month
  const matchPairs: Array<{ month: string; round: string; row1: typeof rows[0]; row2: typeof rows[0] }> = []
  let i = 0
  while (i < tabelaRows.length) {
    const r1 = tabelaRows[i]
    const r2 = tabelaRows[i + 1]
    if (!r2 || r2.round !== r1.round || r2.month !== r1.month) {
      console.log(`Orphan: ${r1.player} ${r1.month}/${r1.round}`)
      i++
      continue
    }
    matchPairs.push({ month: r1.month, round: r1.round, row1: r1, row2: r2 })
    i += 2
  }
  console.log(`Match pairs: ${matchPairs.length}`)
  
  // Clear existing
  await prisma.set.deleteMany()
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } })
  await prisma.playerRanking.deleteMany({ where: { tournamentId: tournament.id } })
  console.log('Cleared existing data')
  
  const scoring = await prisma.scoringConfig.findUnique({ where: { tournamentId: tournament.id } })
  if (!scoring) { console.error('No scoring config!'); return }
  
  let created = 0, skipped = 0, woCount = 0, finishedCount = 0, pendingCount = 0
  
  for (const mp of matchPairs) {
    const u1 = userByNorm[normalize(mp.row1.player)]
    const u2 = userByNorm[normalize(mp.row2.player)]
    
    if (!u1) { console.log(`? ${mp.row1.player}`); skipped++; continue }
    if (!u2) { console.log(`? ${mp.row2.player}`); skipped++; continue }
    
    const isWO1 = mp.row1.set1 === 'W.O.' || mp.row1.woVenc === '1' || mp.row1.woPerd === '1'
    const isWO2 = mp.row2.set1 === 'W.O.' || mp.row2.woVenc === '1' || mp.row2.woPerd === '1'
    const isWO = isWO1 || isWO2
    
    // Postponed: has adiamento=1 AND no scores
    const isPostponed = (mp.row1.adiamento === '1' && (!mp.row1.set1 || mp.row1.set1 === '')) ||
                        (mp.row2.adiamento === '1' && (!mp.row2.set1 || mp.row2.set1 === ''))
    
    const hasScores = mp.row1.set1 && mp.row1.set1 !== 'W.O.' &&
                      mp.row1.vitoria !== '' && mp.row1.vitoria !== undefined
    
    const date1 = parseDate(mp.row1.dateTime, mp.month)
    const date2 = parseDate(mp.row2.dateTime, mp.month)
    const scheduledAt = date1 || date2
    
    let status: string
    let winnerId: string | null = null
    let homeScore: number | null = null
    let awayScore: number | null = null
    let woGivenById: string | null = null
    let woReceivedById: string | null = null
    let woReason: string | null = null
    let finishedAt: Date | null = null
    let setData: Array<{ homeGames: number; awayGames: number }> = []
    
    if (isWO) {
      status = 'wo'
      // Determine winner
      if (mp.row1.woVenc === '1' || mp.row1.set1 === 'W.O.') {
        winnerId = u1.id; woReceivedById = u1.id; woGivenById = u2.id
      } else if (mp.row2.woVenc === '1' || mp.row2.set1 === 'W.O.') {
        winnerId = u2.id; woReceivedById = u2.id; woGivenById = u1.id
      } else if (mp.row1.woPerd === '1') {
        winnerId = u2.id; woReceivedById = u2.id; woGivenById = u1.id
      } else if (mp.row2.woPerd === '1') {
        winnerId = u1.id; woReceivedById = u1.id; woGivenById = u2.id
      }
      woReason = 'Walkover'
      woCount++
      finishedAt = scheduledAt || new Date()
    } else if (hasScores) {
      status = 'finished'
      
      const s1 = [mp.row1.set1, mp.row1.set2, mp.row1.set3].filter(s => s && s !== '').map(s => parseInt(s) || 0)
      const s2 = [mp.row2.set1, mp.row2.set2, mp.row2.set3].filter(s => s && s !== '').map(s => parseInt(s) || 0)
      
      let p1Wins = 0, p2Wins = 0
      for (let j = 0; j < Math.max(s1.length, s2.length); j++) {
        if ((s1[j] || 0) > (s2[j] || 0)) p1Wins++
        else if ((s2[j] || 0) > (s1[j] || 0)) p2Wins++
      }
      
      homeScore = p1Wins
      awayScore = p2Wins
      winnerId = p1Wins > p2Wins ? u1.id : u2.id
      
      for (let j = 0; j < Math.max(s1.length, s2.length); j++) {
        setData.push({ homeGames: s1[j] || 0, awayGames: s2[j] || 0 })
      }
      
      finishedCount++
      finishedAt = scheduledAt || new Date()
    } else if (isPostponed) {
      status = 'pending_scheduling'
      pendingCount++
    } else if (scheduledAt) {
      status = 'scheduled'
    } else {
      status = 'pending_scheduling'
      pendingCount++
    }
    
    const matchData: any = {
      tournamentId: tournament.id,
      homePlayerId: u1.id,
      awayPlayerId: u2.id,
      status,
      scheduledAt,
      round: mp.round,
      month: mp.month,
    }
    if (winnerId) matchData.winnerId = winnerId
    if (homeScore !== null) matchData.homeScore = homeScore
    if (awayScore !== null) matchData.awayScore = awayScore
    if (woGivenById) matchData.woGivenById = woGivenById
    if (woReceivedById) matchData.woReceivedById = woReceivedById
    if (woReason) matchData.woReason = woReason
    if (finishedAt) matchData.finishedAt = finishedAt
    
    // Create match with nested sets
    const createSets = setData.map((s, idx) => ({
      setNumber: idx + 1,
      homeGames: s.homeGames,
      awayGames: s.awayGames,
      isTiebreak: false,
      isSuperTiebreak: false,
    }))
    
    if (createSets.length > 0) {
      matchData.sets = { create: createSets }
    }
    
    await prisma.match.create({ data: matchData })
    created++
  }
  
  console.log(`\nCreated: ${created}, Finished: ${finishedCount}, W.O.: ${woCount}, Pending: ${pendingCount}, Skipped: ${skipped}`)
  
  // Recalculate rankings
  console.log('\n=== Calculating rankings ===')
  const finishedMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: { in: ['finished', 'wo'] } },
    include: { sets: true }
  })
  
  const rankings: Record<string, any> = {}
  
  for (const m of finishedMatches) {
    for (const pid of [m.homePlayerId, m.awayPlayerId]) {
      if (!rankings[pid]) {
        rankings[pid] = { points: 0, mp: 0, w: 0, l: 0, sw: 0, sl: 0, gw: 0, gl: 0 }
      }
      const r = rankings[pid]
      const isWinner = m.winnerId === pid
      const isHome = m.homePlayerId === pid
      r.mp++
      if (isWinner) r.w++; else r.l++
      
      if (m.status === 'wo') {
        r.points += isWinner ? scoring.winByWO : scoring.lossByWO
      } else {
        const hsw = m.sets.filter(s => s.homeGames > s.awayGames).length
        const asw = m.sets.filter(s => s.awayGames > s.homeGames).length
        const sw = isHome ? hsw : asw
        const sl = isHome ? asw : hsw
        const gw = isHome ? m.sets.reduce((a, s) => a + s.homeGames, 0) : m.sets.reduce((a, s) => a + s.awayGames, 0)
        const gl = isHome ? m.sets.reduce((a, s) => a + s.awayGames, 0) : m.sets.reduce((a, s) => a + s.homeGames, 0)
        r.sw += sw; r.sl += sl; r.gw += gw; r.gl += gl
        
        let pts = 0
        if (isWinner) pts = asw === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
        else pts = hsw > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
        r.points += pts
      }
    }
  }
  
  for (const [uid, d] of Object.entries(rankings)) {
    await prisma.playerRanking.upsert({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: uid } },
      update: {
        points: d.points, matchesPlayed: d.mp, wins: d.w, losses: d.l,
        setsWon: d.sw, setsLost: d.sl, gamesWon: d.gw, gamesLost: d.gl,
        setBalance: d.sw - d.sl, gamesBalance: d.gw - d.gl,
      },
      create: {
        tournamentId: tournament.id, userId: uid, position: 0,
        points: d.points, matchesPlayed: d.mp, wins: d.w, losses: d.l,
        setsWon: d.sw, setsLost: d.sl, gamesWon: d.gw, gamesLost: d.gl,
        setBalance: d.sw - d.sl, gamesBalance: d.gw - d.gl,
      }
    })
  }
  
  console.log(`Updated ${Object.keys(rankings).length} rankings`)
  await prisma.$disconnect()
  console.log('\nDone!')
}

main().catch(console.error)
