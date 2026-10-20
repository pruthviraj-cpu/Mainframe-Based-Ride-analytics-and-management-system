//RIDEANLZ JOB (ACCT),'NYC RIDE ANALYTICS',
//             CLASS=A,MSGCLASS=X,MSGLEVEL=(1,1),
//             NOTIFY=&SYSUID
//*
//*================================================================*
//*  JOB:     RIDEANLZ                                             *
//*  PURPOSE: Compile and Execute COBOL Batch - Assignment 2       *
//*           Balance-Line Merge | Fraud Detection | Analytics     *
//*                                                                *
//*  PREREQUISITES:                                                *
//*    - SORTF1 JCL has run (FILE1 sorted by TRIP-ID ASC)         *
//*    - DEDUPF2 REXX has run (FILE2 deduped + sorted by TRIP-ID) *
//*    - SURGEPRC REXX has run (surge pricing already applied)     *
//*                                                                *
//*  OUTPUTS:                                                      *
//*    TRIPLEDG  - FILE3 Master Ledger (clean trips)              *
//*    FRAUDRPT  - FILE4 Fraud Report (flagged records)           *
//*    SUMRPT    - FILE5 Analytics Summary                        *
//*================================================================*
//*
//*----------------------------------------------------------------*
//*  STEP 1: COMPILE THE COBOL PROGRAM                             *
//*----------------------------------------------------------------*
//COMPILE  EXEC PGM=IGYCRCTL,REGION=4M,
//         PARM='RENT,APOST,OPT(2),MAP,LIST,XREF,SSRANGE,DYNAM'
//STEPLIB   DD DSN=IGY.V6R3M0.SIGYCOMP,DISP=SHR
//SYSPRINT  DD SYSOUT=*
//SYSLIN    DD DSN=&&LOADSET,DISP=(NEW,PASS),
//             SPACE=(TRK,(30,10)),UNIT=SYSDA
//SYSIN     DD DSN=USERID.COBOL.SOURCE(RIDEANLZ),DISP=SHR
//*
//*----------------------------------------------------------------*
//*  STEP 2: LINK-EDIT THE COMPILED OBJECT                         *
//*----------------------------------------------------------------*
//LKED     EXEC PGM=IEWL,COND=(8,LT,COMPILE),REGION=4M,
//         PARM='RENT,REUS,REFR,RMODE=24,AMODE=31'
//SYSPRINT  DD SYSOUT=*
//SYSLMOD   DD DSN=USERID.COBOL.LOAD(RIDEANLZ),DISP=SHR
//SYSLIN    DD DSN=&&LOADSET,DISP=(OLD,DELETE)
//          DD DSN=CEE.SCEELKED,DISP=SHR
//*
//*----------------------------------------------------------------*
//*  STEP 3: EXECUTE THE BATCH PROGRAM                             *
//*----------------------------------------------------------------*
//EXECUTE  EXEC PGM=RIDEANLZ,COND=(8,LT,LKED),REGION=8M
//STEPLIB   DD DSN=USERID.COBOL.LOAD,DISP=SHR
//          DD DSN=CEE.SCEERUN,DISP=SHR
//*
//*  INPUT DD STATEMENTS
//*  TRIPDATA = FILE1: Sorted Trip Data (pre-sorted by SORTF1 JCL)
//TRIPDATA  DD DSN=USERID.TAXI.FILE1.SORTED,DISP=SHR
//*
//*  DRVDATA  = FILE2: Sorted Driver Data (de-duped by DEDUPF2 REXX)
//DRVDATA   DD DSN=USERID.TAXI.FILE2.SORTED,DISP=SHR
//*
//*  OUTPUT DD STATEMENTS
//*  LEDGER  = FILE3: Master Ledger - clean matched trips
//LEDGER    DD DSN=USERID.TAXI.FILE3.LEDGER,
//             DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA,
//             DCB=(RECFM=FB,LRECL=80,BLKSIZE=32720)
//*
//*  FRAUDRPT = FILE4: Fraud Report - flagged records
//FRAUDRPT  DD DSN=USERID.TAXI.FILE4.FRAUDRPT,
//             DISP=(NEW,CATLG,DELETE),
//             SPACE=(TRK,(5,2)),UNIT=SYSDA,
//             DCB=(RECFM=FB,LRECL=80,BLKSIZE=32720)
//*
//*  SUMRPT  = FILE5: Analytics Summary Report - print-format
//SUMRPT    DD DSN=USERID.TAXI.FILE5.SUMRPT,
//             DISP=(NEW,CATLG,DELETE),
//             SPACE=(TRK,(2,1)),UNIT=SYSDA,
//             DCB=(RECFM=FB,LRECL=80,BLKSIZE=3200)
//*
//*  System runtime / runtime diagnostics
//SYSOUT    DD SYSOUT=*
//CEEDUMP   DD SYSOUT=*
//SYSUDUMP  DD SYSOUT=*
//*
//
