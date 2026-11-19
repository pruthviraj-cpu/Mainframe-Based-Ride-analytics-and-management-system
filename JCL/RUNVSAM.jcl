//RUNVSAM  JOB 1,CLASS=A,MSGLEVEL=(1,1),NOTIFY=&SYSUID
//* -------------------------------------------------------------
//* EXECUTE COBOL VSAM KSDS RANDOM KEYED LOOKUP (O(1) READ)
//* -------------------------------------------------------------
//EXECVSAM EXEC PGM=VSAMREAD
//STEPLIB  DD DSN=&SYSUID..LOAD,DISP=SHR
//RIDEVSAM DD DSN=&SYSUID..RIDE.FILE3.VSAM,DISP=SHR
//SYSOUT   DD SYSOUT=*
//SYSPRINT DD SYSOUT=*
