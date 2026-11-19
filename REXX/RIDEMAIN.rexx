/* REXX */
/*===================================================================*/
/* PROGRAM: RIDEMAIN                                                 */
/* PURPOSE: Interactive ISPF Controller for NYC Taxi Analytics       */
/* AUTHOR:  PRUTHVIRAJ GAWANDE                                       */
/*===================================================================*/

address ISPEXEC

/* Stack panel library dynamically */
"LIBDEF ISPPLIB DATASET ID('Z73984.PANELS') STACK"

do forever
  zcmd = ""
  "DISPLAY PANEL(RIDEPAN)"
  disp_rc = rc

  if disp_rc > 4 then leave  /* PF3 / END pressed */

  zcmd = strip(translate(zcmd))

  select
    when zcmd = "1" then do
      "BROWSE DATASET('Z73984.RIDE.LEDGER.FMT')"
    end

    when zcmd = "2" then do
      "BROWSE DATASET('Z73984.RIDE.FRAUD.FMT')"
    end

    when zcmd = "3" then do
      "BROWSE DATASET('Z73984.RIDE.FILE5.SUMMARY')"
    end

    when zcmd = "4" then do
      "BROWSE DATASET('Z73984.RIDE.DRIVERS.FMT')"
    end

    when zcmd = "5" then do
      "BROWSE DATASET('Z73984.RIDE.SURGE.FMT')"
    end

    when zcmd = "6" then do
      "BROWSE DATASET('Z73984.RIDE.EXEC.LOG')"
    end

    when zcmd = "7" then do
      say ""
      say "=========================================================="
      say "  SUBMITTING COBOL BATCH JOB: Z73984.JCL(RUNRIDE)         "
      say "=========================================================="
      address TSO "SUBMIT 'Z73984.JCL(RUNRIDE)'"
      say ""
      say "  >>> JOB SUBMITTED TO JES2! RUNNING COBOL RIDEANLZ <<<   "
      say "  >>> ALL LEDGERS & FRAUD METRICS AUTOMATICALLY UPDATED <<<"
      say ""
      say "  Press ENTER to return to the ISPF Menu..."
      say "=========================================================="
      pull ans
    end

    when zcmd = "8" then do
      "BROWSE DATASET('Z73984.RIDE.FILE3.LEDGER')"
    end

    when zcmd = "9" then do
      "BROWSE DATASET('Z73984.RIDE.FILE3.VSAM')"
    end

    when zcmd = "X" | zcmd = "EXIT" then leave

    otherwise nop
  end
end

/* Free stacked panel library */
"LIBDEF ISPPLIB"

exit 0
