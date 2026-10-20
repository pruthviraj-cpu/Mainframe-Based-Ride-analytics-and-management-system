//MASTERWF JOB (ACCT),'MASTER WORKFLOW',CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*===================================================================*
//* ASSIGNMENT 4: MASTER CONDITIONAL WORKFLOW (AUTOMATED PIPELINE)    *
//* Orchestrates Data Sanitization (JCL SORT + REXX), COBOL Analytics,*
//* Return Code evaluation (IF RC = 00), and backup/safeguard copy.   *
//*===================================================================*
//*********************************************************************
//* STEP 00: HOUSEKEEPING - DELETE PREVIOUS OUTPUT DATASETS           *
//*********************************************************************
//CLEANUP  EXEC PGM=IEFBR14
//DELF1S   DD DSN=&SYSUID..RIDE.FILE1.SORTED,
//            DISP=(MOD,DELETE,DELETE),SPACE=(TRK,(0))
//DELF2S   DD DSN=&SYSUID..RIDE.FILE2.SORTED,
//            DISP=(MOD,DELETE,DELETE),SPACE=(TRK,(0))
//DELOUT   DD DSN=&SYSUID..RIDE.ANALYTICS.REPORT,
//            DISP=(MOD,DELETE,DELETE),SPACE=(TRK,(0))
//DELBKUP  DD DSN=&SYSUID..RIDE.BACKUP.REPORT,
//            DISP=(MOD,DELETE,DELETE),SPACE=(TRK,(0))
//
//*********************************************************************
//* STEP 01 (ASSIGNMENT 1): SORT & DEDUPLICATE FILE 1 (TRIP DATA)     *
//*********************************************************************
//SORTF1   EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=&SYSUID..RIDE.FILE1.RAW,DISP=SHR
//SORTOUT  DD DSN=&SYSUID..RIDE.FILE1.SORTED,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//SYSIN    DD *
  SORT FIELDS=(13,8,CH,A)
  SUM FIELDS=NONE
/*
//
//*********************************************************************
//* STEP 02 (ASSIGNMENT 3): REXX SCRIPT DEDUP & SORT FILE 2 (DRIVER)  *
//* Runs only if File 1 sort succeeded (RC = 0)                       *
//*********************************************************************
//IFSTEP01 IF (SORTF1.RC = 0) THEN
//REXXF2   EXEC PGM=IKJEFT01
//SYSPROC  DD DSN=&SYSUID..RIDE.REXX,DISP=SHR
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  %DEDUPF2
/*
//INFILE   DD DSN=&SYSUID..RIDE.FILE2.RAW,DISP=SHR
//OUTFILE  DD DSN=&SYSUID..RIDE.FILE2.SORTED,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//ENDIF01  ENDIF
//
//*********************************************************************
//* STEP 03 (ASSIGNMENT 2): COBOL MATCH & ANALYTICS EXECUTION         *
//* Triggered only if both sanitization steps succeeded (RC = 00)     *
//*********************************************************************
//IFPREP   IF (SORTF1.RC = 0 AND REXXF2.RC = 0) THEN
//RUNCOBOL EXEC PGM=RIDECOB
//STEPLIB  DD DSN=&SYSUID..RIDE.LOADLIB,DISP=SHR
//FILE1IN  DD DSN=&SYSUID..RIDE.FILE1.SORTED,DISP=SHR
//FILE2IN  DD DSN=&SYSUID..RIDE.FILE2.SORTED,DISP=SHR
//OUTREPT  DD DSN=&SYSUID..RIDE.ANALYTICS.REPORT,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSUDUMP DD SYSOUT=*
//ENDIF02  ENDIF
//
//*********************************************************************
//* STEP 03B: REXX DYNAMIC SURGE PRICING ANALYTICS                    *
//* Computes zone demand and surge multipliers                        *
//*********************************************************************
//IFSURGE  IF (SORTF1.RC = 0) THEN
//SURGSTEP EXEC PGM=IKJEFT01
//SYSPROC  DD DSN=&SYSUID..RIDE.REXX,DISP=SHR
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  %SURGEPRC
/*
//TRIPIN   DD DSN=&SYSUID..RIDE.FILE1.SORTED,DISP=SHR
//SURGEOUT DD DSN=&SYSUID..RIDE.SURGE.REPORT,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//ENDIF03  ENDIF
//
//*********************************************************************
//* STEP 04 (ASSIGNMENT 4): CONDITIONAL COPY/BACKUP VIA IEBGENER      *
//* Only executed if COBOL pipeline completes cleanly (RC = 00)       *
//*********************************************************************
//IFCOBOK  IF (RUNCOBOL.RC = 0) THEN
//BACKUP   EXEC PGM=IEBGENER
//SYSPRINT DD SYSOUT=*
//SYSUT1   DD DSN=&SYSUID..RIDE.ANALYTICS.REPORT,DISP=SHR
//SYSUT2   DD DSN=&SYSUID..RIDE.BACKUP.REPORT,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//SYSIN    DD DUMMY
//ENDIF03  ENDIF
//
//*********************************************************************
//* STEP 05: CONDITIONAL FAILURE ALERT STEP                           *
//* Executes if any prior step failed (RC > 0 or ABEND)               *
//*********************************************************************
//IFFAIL   IF (SORTF1.RC > 0 OR REXXF2.RC > 0 OR RUNCOBOL.RC > 0) THEN
//FAILMSG  EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  WRITE *** CRITICAL ALERT: RIDE PIPELINE ENCOUNTERED AN ERROR ***
  WRITE *** CHECK SYSOUT LISTINGS FOR FAILED STEP DETAILS ***
/*
//ENDIF04  ENDIF
//
